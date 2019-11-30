
(function() {

  'use strict';

  const ENTER_KEY = 13;
  const newTodoDom = document.getElementById('new-todo');
  const todosDom = document.getElementById('todo-list');

  addEventListeners();
  setTimeout(() => refreshUI().then(() => syncIt()), 100);

  // -------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------

  const refreshUI = async () => {
    const todos = memory.cache.query(q => q.findRecords("planet").sort("name"));
    // console.log("memory:", todos.length);
    todosDom.innerHTML = '';
    todos.forEach(p => UI(p));
  }

  const syncIt = async () => {
    await remote
      .query(q => q.findRecords("planet").sort("name"))
      .then(todos => console.log("remote:", todos.length))
      .then(() => refreshUI())
      .catch(e => {
        // // errors caught by remoteQueryFail
      });
  };

  const processQueue = async() => {
    console.log(`queue: ${queue.length}`);
    if (queue.current) {
      await queue.retry().catch(e => {
        if (e.response) {
          const status = e.response.status;
          if (status === 400 || status === 405) {
            console.log('error when retrying - skip [DATA LOSS?]');
            queue.skip();
          }
        }
      });
    }
  }

  const addTodo = async (text) => {
    const todo = {
      type: "planet",
      attributes: {
        name: text,
        classification: "terrestrial",
        atmosphere: true
      }
    };
    await memory.update(t => t.addRecord(todo))
    refreshUI();
  }

  const deleteButtonPressed = async (todo) => {
    document.getElementById('li_' + todo.id).style.display = "none";
    await memory.update(t => t.removeRecord(todo))
  }

  const checkboxChanged = async (todo, event) => {
    todo.attributes.atmosphere = event.target.checked;
    await memory.update(t => t.updateRecord(todo));
  }

  const todoBlurred = async (todo, event) => {
    const trimmedText = event.target.value.trim();
    if (!trimmedText) {
      deleteButtonPressed(todo);
    } else {
      todo.attributes.name = trimmedText;
      await memory.update(t => t.updateRecord(todo));
    }
  }

  // -------------------------------------------------------------------
  // UI Actions
  // -------------------------------------------------------------------

  function todoKeyPressed(todo) {
    if (event.keyCode === ENTER_KEY) {
      const inputEditTodo = document.getElementById('input_' + todo.id);
      inputEditTodo.blur();
      refreshUI();
    }
  }

  function newTodoKeyPressHandler( event ) {
    if (event.keyCode === ENTER_KEY) {
      if (! newTodoDom.value) return;
      addTodo(newTodoDom.value);
      newTodoDom.value = '';
    }
  }

  // User has double clicked a todo, display an input so they can edit the name
  function todoDblClicked(todo) {
    const div = document.getElementById('li_' + todo.id);
    const inputEditTodo = document.getElementById('input_' + todo.id);
    div.className = 'editing';
    inputEditTodo.focus();
  }

  // -------------------------------------------------------------------

  function addEventListeners() {
    newTodoDom.addEventListener('keypress', newTodoKeyPressHandler, false);
    document.getElementById('syncIt').addEventListener('click', () => syncIt(this));
    document.getElementById('refreshUI').addEventListener('click', () => refreshUI(this));
    document.getElementById('processQueue').addEventListener('click', () => processQueue(this));
  }

  function UI(todo, id) {
    if (todo) {
      todosDom.appendChild(createTodoListItem(todo));
    }
  }

  function createTodoListItem(todo) {
    var checkbox = document.createElement('input');
    checkbox.className = 'toggle';
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', checkboxChanged.bind(this, todo));

    var label = document.createElement('label');
    label.appendChild( document.createTextNode(todo.attributes.name));
    let remoteId = todo.keys ? todo.keys.remoteId : 'xxx';
    let copy = '<strong>' + todo.attributes.name + '</strong>';
    copy += ' <span class="remote-id">ID: ' + remoteId + '</span>';
    label.innerHTML = copy;
    label.addEventListener('dblclick', todoDblClicked.bind(this, todo));

    var deleteLink = document.createElement('button');
    deleteLink.className = 'destroy';
    deleteLink.addEventListener( 'click', deleteButtonPressed.bind(this, todo));

    var divDisplay = document.createElement('div');
    divDisplay.className = 'view';
    divDisplay.appendChild(checkbox);
    divDisplay.appendChild(label);
    divDisplay.appendChild(deleteLink);

    var inputEditTodo = document.createElement('input');
    inputEditTodo.id = 'input_' + todo.id;
    inputEditTodo.className = 'edit';
    inputEditTodo.value = todo.attributes.name;
    inputEditTodo.addEventListener('keypress', todoKeyPressed.bind(this, todo));
    inputEditTodo.addEventListener('blur', todoBlurred.bind(this, todo));

    var li = document.createElement('li');
    li.id = 'li_' + todo.id;
    li.appendChild(divDisplay);
    li.appendChild(inputEditTodo);

    if (todo.attributes.atmosphere) {
      li.className += 'complete';
      checkbox.checked = true;
    }

    return li;
  }

})();
