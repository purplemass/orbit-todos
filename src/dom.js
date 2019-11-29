
(function() {

  'use strict';

  const ENTER_KEY = 13;
  const newTodoDom = document.getElementById('new-todo');
  const todosDom = document.getElementById('todo-list');

  addEventListeners();
  setTimeout(() => refreshUI(), 100);

  // -------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------

  const refreshUI = async () => {
    const todos = await memory.cache.query(q => q.findRecords("planet").sort("name"));
    console.log("memory:", todos.length);
    refresh(todos);
  }

  const syncIt = async () => {
    const todos = await remote.query(q => q.findRecords("planet").sort("name"));
    console.log("remote:", todos.length);
    refresh(todos);
  };

  const deactivate = async() => {
    console.log('deactivate');
    await coordinator.deactivate()
    // await coordinator.removeStrategy('some-strategy');
    // await coordinator.addStrategy(someStrategy);
    await coordinator.removeSource('remote');
    await coordinator.addSource(remote);
    await coordinator.activate();
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
    console.log(todo);
    await memory.update(t => t.removeRecord(todo))
  }

  const checkboxChanged = async (todo, event) => {
    todo.attributes.atmosphere = event.target.checked;
    await memory.update(t => t.updateRecord(todo));
  }

  const todoBlurred = async (todo, event) => {
    console.log('todoBlurred', todo);
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
    }
  }

  function newTodoKeyPressHandler( event ) {
    if (event.keyCode === ENTER_KEY) {
      addTodo(newTodoDom.value);
      newTodoDom.value = '';
    }
  }

  // User has double clicked a todo, display an input so they can edit the name
  function todoDblClicked(todo) {
    var div = document.getElementById('li_' + todo.id);
    var inputEditTodo = document.getElementById('input_' + todo.id);
    div.className = 'editing';
    inputEditTodo.focus();
  }

  // -------------------------------------------------------------------

  function addEventListeners() {
    newTodoDom.addEventListener('keypress', newTodoKeyPressHandler, false);
    document.getElementById('syncIt').addEventListener('click', () => syncIt(this));
    document.getElementById('deactivate').addEventListener('click', () => deactivate(this));
    document.getElementById('refreshUI').addEventListener('click', () => refreshUI(this));
  }

  function refresh(todos) {
    todosDom.innerHTML = '';
    todos
      // .map(p => ({...p, id: p.attributes.uuid}))
      .forEach(p => UI(p));

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
    let remoteId = '';
    if (todo.keys) remoteId = todo.keys.remoteId;
    let copy = '<strong>' + todo.attributes.name + '</strong>';
    copy += ' ';
    copy += '<small>' + todo.id + '</small>';
    copy += ' | ';
    copy += '<small>' + remoteId + '</small>';
    // copy += ' | ';
    // copy += '<small>' + remoteId + '</small>';
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
