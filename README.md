# Orbit Todos

Simple todo list client/server application with offline support using Orbit.js.

## Front-end

### Install

    npm i

### Build and run

    npm start

## Back-end

To fully utilise this application you'll need a server that can support the models defined in this project.

*The web server must conform with the JSON:API specification.*

A sample Django server with JSON:API support is included in this repo.

### Install

Ensure you have Python 3.7.

Create your virtual environment, activate it and run:

    pip install -r server/requirements.txt
    python server/manage.py migrate

### Run

    python server/manage.py runserver

You should be able to see Django's Admin area here:

    http://localhost:8000/admin-orbit

Access the API here:

    http://localhost:8000/api-orbit/todos
