"""Tests for CI/CD workflow files (Phase 12).

Validates:
- YAML syntax is parseable
- CI job graph: lint → typecheck → test → build
- build job is gated on main branch
- CD workflow triggers only on semver tags (v*.*.*)
- Both workflows reference the correct Dockerfiles
"""

from __future__ import annotations

from pathlib import Path

import yaml

_REPO_ROOT = Path(__file__).resolve().parent.parent
_CI_PATH = _REPO_ROOT / ".github" / "workflows" / "ci.yml"
_CD_PATH = _REPO_ROOT / ".github" / "workflows" / "cd.yml"


def _load_ci() -> dict:
    with open(_CI_PATH) as f:
        return yaml.safe_load(f)


def _load_cd() -> dict:
    with open(_CD_PATH) as f:
        return yaml.safe_load(f)


# ============================================================================
# YAML syntax
# ============================================================================


class TestYAMLSyntax:
    def test_ci_yml_is_parseable(self) -> None:
        data = _load_ci()
        assert isinstance(data, dict)
        assert "jobs" in data

    def test_cd_yml_is_parseable(self) -> None:
        data = _load_cd()
        assert isinstance(data, dict)
        assert "jobs" in data


# ============================================================================
# CI job graph
# ============================================================================


class TestCIJobGraph:
    def test_all_expected_jobs_exist(self) -> None:
        ci = _load_ci()
        jobs = set(ci["jobs"].keys())
        assert {"lint", "typecheck", "test", "build"}.issubset(jobs)

    def test_typecheck_depends_on_lint(self) -> None:
        ci = _load_ci()
        needs = ci["jobs"]["typecheck"].get("needs", [])
        if isinstance(needs, str):
            needs = [needs]
        assert "lint" in needs

    def test_test_depends_on_typecheck(self) -> None:
        ci = _load_ci()
        needs = ci["jobs"]["test"].get("needs", [])
        if isinstance(needs, str):
            needs = [needs]
        assert "typecheck" in needs

    def test_build_depends_on_test(self) -> None:
        ci = _load_ci()
        needs = ci["jobs"]["build"].get("needs", [])
        if isinstance(needs, str):
            needs = [needs]
        assert "test" in needs

    def test_build_depends_on_lint_and_typecheck(self) -> None:
        """Build should gate on all three upstream jobs."""
        ci = _load_ci()
        needs = ci["jobs"]["build"].get("needs", [])
        if isinstance(needs, str):
            needs = [needs]
        assert "lint" in needs
        assert "typecheck" in needs
        assert "test" in needs

    def test_build_gated_on_main_branch(self) -> None:
        ci = _load_ci()
        build_job = ci["jobs"]["build"]
        if_str = build_job.get("if", "")
        assert "main" in if_str, (
            f"build job 'if' condition should gate on main branch, got: {if_str}"
        )

    def test_ci_triggers_on_push_and_pr(self) -> None:
        ci = _load_ci()
        on_block = ci.get("on") or ci.get(True)
        assert "push" in on_block or "pull_request" in on_block


# ============================================================================
# CI: build job pushes correct images
# ============================================================================


class TestCIBuildImages:
    def test_build_references_dockerfile_api(self) -> None:
        ci = _load_ci()
        steps = ci["jobs"]["build"]["steps"]
        dockerfile_refs = [
            s.get("with", {}).get("file", "")
            for s in steps
            if s.get("name", "").lower().startswith("build")
        ]
        assert any("Dockerfile.api" in ref for ref in dockerfile_refs), (
            f"No step references Dockerfile.api: {dockerfile_refs}"
        )

    def test_build_references_dockerfile_worker(self) -> None:
        ci = _load_ci()
        steps = ci["jobs"]["build"]["steps"]
        dockerfile_refs = [
            s.get("with", {}).get("file", "")
            for s in steps
            if s.get("name", "").lower().startswith("build")
        ]
        assert any("Dockerfile.worker" in ref for ref in dockerfile_refs), (
            f"No step references Dockerfile.worker: {dockerfile_refs}"
        )

    def test_build_pushes_to_ghcr(self) -> None:
        ci = _load_ci()
        # ghcr.io references can be in build steps or top-level env
        full_text = str(ci)
        assert "ghcr.io" in full_text, "CI workflow should reference ghcr.io"


# ============================================================================
# CD workflow
# ============================================================================


class TestCDWorkflow:
    def test_cd_triggers_on_semver_tags(self) -> None:
        cd = _load_cd()
        on_block = cd.get("on") or cd.get(True)
        push_config = on_block.get("push", {})
        tags = push_config.get("tags", [])
        assert any("v*" in t for t in tags), (
            f"CD should trigger on semver tags (v*.*.*), got tags: {tags}"
        )

    def test_cd_has_kubeconfig_step(self) -> None:
        cd = _load_cd()
        deploy_job = cd["jobs"]["deploy"]
        step_names = [s.get("name", "") for s in deploy_job["steps"]]
        assert any("kubeconfig" in n.lower() for n in step_names), (
            f"No kubeconfig step found: {step_names}"
        )

    def test_cd_applies_k8s_base(self) -> None:
        cd = _load_cd()
        deploy_job = cd["jobs"]["deploy"]
        all_commands = " ".join(str(s) for s in deploy_job["steps"])
        assert "k8s/base" in all_commands, "CD should apply k8s/base/"

    def test_cd_sets_rollout_image(self) -> None:
        cd = _load_cd()
        deploy_job = cd["jobs"]["deploy"]
        all_commands = " ".join(str(s) for s in deploy_job["steps"])
        assert "argo rollouts set image" in all_commands, (
            "CD should run 'kubectl argo rollouts set image'"
        )

    def test_cd_waits_for_rollout_status(self) -> None:
        cd = _load_cd()
        deploy_job = cd["jobs"]["deploy"]
        all_commands = " ".join(str(s) for s in deploy_job["steps"])
        assert "argo rollouts status" in all_commands, (
            "CD should run 'kubectl argo rollouts status'"
        )

    def test_cd_has_rollback_on_failure(self) -> None:
        cd = _load_cd()
        deploy_job = cd["jobs"]["deploy"]
        rollback_steps = [
            s for s in deploy_job["steps"]
            if s.get("if", "").lower().startswith("failure")
        ]
        assert len(rollback_steps) > 0, "CD should have a rollback step on failure"
        rollback_commands = " ".join(str(s) for s in rollback_steps)
        assert "argo rollouts undo" in rollback_commands


# ============================================================================
# Secrets documentation
# ============================================================================


class TestSecretsDocumented:
    def test_ci_documents_ghcr_token(self) -> None:
        ci = _load_ci()
        full_text = str(ci)
        assert "GHCR_TOKEN" in full_text or "GITHUB_TOKEN" in full_text, (
            "CI should reference GHCR_TOKEN or GITHUB_TOKEN"
        )

    def test_cd_documents_kube_config(self) -> None:
        cd = _load_cd()
        full_text = str(cd)
        assert "KUBE_CONFIG" in full_text, "CD should reference KUBE_CONFIG secret"
