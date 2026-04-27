================================
Development Guidelines (Backend)
================================

This document outlines the technical standards and best practices for API development within our monorepo. Following these guidelines ensures system maintainability, code clarity, and seamless team collaboration.

Code Language
=============

1. English as the Primary Language
----------------------------------

**English** is the default language for source code and documentation. This rule applies to:
* Variable, function, class, and method names.
* Database models, fields, and table names.
* Code comments and Docstrings.
* Log messages and dictionary/JSON keys.

*Exception:* Seed data or locale-specific content (e.g., Portuguese translations for the UI) may contain Portuguese, but the underlying business logic must remain in English.

Django & REST Framework
=======================

1. Code Style and Naming Conventions
------------------------------------

* **PEP 8**: Strict compliance with PEP 8 is mandatory. Use the ``mise run api.lint`` command frequently.
* **Classes**: Use ``PascalCase`` (e.g., ``DriverProfile``, ``RegisterUserSerializer``).
* **Functions and Variables**: Use ``snake_case`` (e.g., ``calculate_trip_cost``, ``driver_id``).
* **Strings**: Prefer double quotes (``"``), except for simple dictionary keys where single quotes are acceptable.

2. Domain Logic Design
----------------------

* **Fat Models, Thin Views**: Keep core database logic inside the models. API data validation and transformation should reside strictly in **Serializers**.
* **Service Layer**: For complex operations involving multiple models or external integrations, isolate the logic in a ``services.py`` module within the respective app.
* **Explicit Serialization**: Always declare serializer fields explicitly. 
    * **Correct**: ``fields = ("id", "full_name", "cnh")``
    * **Forbidden**: ``fields = "__all__"``

3. Database and Migrations
--------------------------

* **Atomicity**: Wrap multi-table write operations in a ``transaction.atomic`` block (e.g., creating a user and their associated profile simultaneously).
* **Migration Naming**: When generating custom or complex migrations, rename the file to reflect its purpose (e.g., ``0002_add_driver_cnh_index.py``).

Quality Assurance
=================

1. Test Coverage
----------------

* Every new endpoint must include comprehensive integration tests using ``APITestCase``.
* Run ``mise run api.test.cov`` to ensure critical business logic is fully covered and free of "blind spots".

2. Logging Strategy
-------------------

* Use Python's built-in ``logging`` module instead of ``print()`` statements.
* Error logs must provide sufficient context for debugging but **must never** expose Personally Identifiable Information (PII) or sensitive credentials.

Version Control (Git)
=====================

1. Semantic Commits
-------------------

We strictly follow the **Conventional Commits** specification. For backend changes, use the following scopes:

* ``feat(back):`` Introduces a new feature.
* ``fix(back):`` Patches a bug.
* ``refactor(back):`` Code changes that neither fix a bug nor add a feature.
* ``chore(back):`` Updates to dependencies, CI pipelines, or environment configs.

*Example:* ``feat(back): implement nested serializer for driver creation``

Development Workflow
====================

1. Branching Strategy
---------------------

* **Feature Branches**: Create one branch per task (e.g., ``feature/manage-drivers``).
* **Monorepo Atomicity**: Frontend and Backend changes related to the same task **must** be committed to the same branch. This guarantees that the API contract remains perfectly synchronized upon merge.

2. Local Development Cycle
--------------------------

Before pushing code or opening a Pull Request, verify your local environment is healthy:

* **Migrations**: Run ``mise run api.makemigrations`` and resolve any conflicts.
* **Linting**: Run ``mise run api.lint``. Code containing style violations or unused imports will fail the CI pipeline.
* **Formatting**: Run ``mise run api.formatter`` to align your code with the Ruff formatter.
* **Tests**: Run ``mise run api.test``. A build is only considered stable if 100% of the tests pass.

API Response Standards (DRF)
============================

To ensure seamless Frontend consumption, adhere to the following payload rules:

1. Data Format
--------------

* **Content-Type**: All responses must be valid JSON.
* **Keys**: JSON keys must default to ``snake_case`` (inheriting from Django) unless a global camelCase parser/renderer is explicitly configured.
* **Dates**: Datetime objects must be returned in the ISO 8601 format.

2. Error Handling
-----------------

* **Validation Errors (400 Bad Request)**: Must return an object detailing the specific error array for each failing field.
* **Generic Errors**: Unexpected errors should return a ``"detail"`` key with a user-friendly, explanatory message in English.

*Example of a validation error payload:*

.. code-block:: json

    {
        "cnh": ["This driver license is already in use."],
        "email": ["Enter a valid email address."]
    }

Documentation and Contract
==========================

1. Swagger/OpenAPI
------------------

* **Spectacular**: Any endpoint that DRF cannot accurately infer must be manually decorated with ``@extend_schema``.
* **Descriptions**: Utilize the ``help_text`` argument in model and serializer fields to ensure clear descriptions are auto-generated in the Swagger UI.

Environment & Tooling
=====================

1. Task Automation (Mise)
-------------------------

* Any new repetitive task, build step, or maintenance script must be added to the ``mise`` configuration file. This ensures all team members execute tasks uniformly.

2. Environment Variables
------------------------

* **Never** commit ``.env`` files containing real credentials to version control. 
* Use the provided ``env.development`` file as a template to construct your local ``.env`` file.
* Secret Key Security: Never hard-code the SECRET_KEY in any settings file. It must be fetched from environment variables.