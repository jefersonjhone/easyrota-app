==========================================
Onboarding Guide: Backend API 
==========================================
This document provides the necessary guidance to set up your environment and understand the architectural patterns adopted in this monorepo.

Tools and Dependencies
======================

To ensure consistency across environments, we use the following management tools:

* **Poetry**: Python dependency manager (configured in ``pyproject.toml``).
* **Mise**: Global runtime manager. We use Mise to automate common tasks through shortcuts.

Quick Start
===========

Get a local environment running in a few minutes:

.. code-block:: bash

    poetry install
    mise install
    cp env.development .env
    mise run api.migrate
    mise run api.server

The API should be available at:

.. code-block:: text

    http://127.0.0.1:8000/

Automation Commands (Mise)
---------------------------

Instead of long commands, use the aliases below:

+---------------------------+------------------------------------------------------------+
| Task Name                 | Description                                                |
+===========================+============================================================+
| ``api.server``            | Starts the Django development server.                      |
+---------------------------+------------------------------------------------------------+
| ``api.migrate``           | Applies pending database migrations.                       |
+---------------------------+------------------------------------------------------------+
| ``api.makemigrations``    | Detects model changes and creates new migration files.     |
+---------------------------+------------------------------------------------------------+
| ``api.test``              | Runs the test suite using Pytest.                          |
+---------------------------+------------------------------------------------------------+
| ``api.test.cov``          | Runs tests and generates a code coverage report.           |
+---------------------------+------------------------------------------------------------+
| ``api.linter``            | Runs Ruff to check for linting violations.                 |
+---------------------------+------------------------------------------------------------+
| ``api.formatter``         | Automatically fixes code formatting issues using Ruff.     |
+---------------------------+------------------------------------------------------------+
| ``api.docs.serve``        | Starts the documentation server with hot-reload (Port 5000)|
+---------------------------+------------------------------------------------------------+
| ``api.docs.build``        | Generates static HTML documentation via Sphinx.            |
+---------------------------+------------------------------------------------------------+
| ``api.docs.clean``        | Deletes the current documentation build artifacts.         |
+---------------------------+------------------------------------------------------------+


Development Workflow
==================

Recommended development flow :

1. Create a feature branch from the integration branch or main:

.. code-block:: bash

    git checkout -b feature/your-task-name

2. Start the environment and sync dependencies:

.. code-block:: bash

    poetry install
    mise run api.migrate

3. Implement your changes.

4. Validate code locally before pushing:

.. code-block:: bash

    mise run api.lint
    mise run api.formatter
    mise run api.test

5. Open a Pull Request only after linting and tests pass.

Project Structure
=================

The structure is designed to separate configuration from domain logic, avoiding the typical clutter of large Django projects:

.. code-block:: text

    api
    ├── apps/                 # Application domains (Users, Trips, Reservations)
    ├── config/               # Global Django settings
    │   └── settings/         # Environment split (dev, prod, test)
    ├── docs/                 # Technical documentation (Sphinx)
    ├── logs/                 # Rotated log files
    └── manage.py

App Division
------------

1. **Users**: Authentication, profiles, and access control.
2. **Trips**: Routes, vehicles, and trip management.
3. **Reservations**: Check-in flows, reservations, and penalties.

Environment Settings
--------------------

The settings in ``config/settings/`` are modular:
* **Development**: Debug enabled, terminal logs, insecure keys.
* **Production**: Strict security, keys via environment variables, persistent logs.
* **Testing**: In-memory database and optimizations for execution speed.

Code and Documentation Standards
================================

Technical Documentation (Sphinx)
-------------------------------

We use Sphinx to generate documentation from code **docstrings**. The adopted standard is **Google Style**.

.. code-block:: python

    def fetch_user_data(user_id: int) -> dict:
        """Retrieves user information from the database.

        Args:
            user_id: The unique identifier for the user.

        Returns:
            A dictionary containing user records.
        """
        return {}
        
The documentation tasks are specifically configured to:

* **Auto-generate**: ``api.docs.build`` uses ``sphinx-apidoc`` to scan the codebase and update API references.
* **Hot-reload**: ``api.docs.serve`` watches for changes in the ``apps/`` directory and refreshes the browser automatically.

API Documentation (OpenAPI)
----------------------------

The backend exposes an OpenAPI schema generated automatically from DRF and
enhanced through manual schema annotations when needed.

Available endpoints:

+----------------------+-----------------------------------------+
| Endpoint             | Purpose                                 |
+======================+=========================================+
| ``/api/schema/``     | Raw OpenAPI schema                      |
+----------------------+-----------------------------------------+
| ``/api/docs/``       | Interactive Swagger documentation       |
+----------------------+-----------------------------------------+

Code Quality
------------

* **Tests**: We use **Pytest**. Ensure new code has test coverage.
* **Linter/Formatter**: **Ruff** is our official tool. Rules defined in ``ruff.toml``. Always format your code before opening a Pull Request.

Logs
====

Logs are displayed in the terminal and saved in ``/logs/``. The files have automatic rotation (10MB limit) to prevent disk exhaustion in long-running environments.

