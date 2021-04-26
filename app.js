const express = require("express");
const sqlite3 = require("sqlite3");
const path = require("path");
const { open } = require("sqlite");
const { isValid, format, parseISO } = require("date-fns");

const app = express();
app.use(express.json());

const dbFilePath = path.join(__dirname, "todoApplication.db");

let db = null;
const initialize = async () => {
  try {
    db = await open({
      filename: dbFilePath,
      driver: sqlite3.Database,
    });
    app.listen(3004, () => {
      console.log("server is up and firing");
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

initialize();

//middleware functions
const validate = (request, response, next) => {
  const {
    status = "",
    priority = "",
    category = "",
    dueDate = "",
  } = request.body;
  if (priority !== "") {
    const possiblePriority = ["HIGH", "MEDIUM", "LOW"];
    if (possiblePriority.includes(priority)) {
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (status != "") {
    const possibleStatus = ["TO DO", "IN PROGRESS", "DONE"];
    if (possibleStatus.includes(status)) {
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (category !== "") {
    const possibleCategory = ["WORK", "HOME", "LEARNING"];
    if (possibleCategory.includes(category)) {
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (dueDate !== "") {
    const n = dueDate.search(
      /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/i
    );
    if (n === -1) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
      request.query.date = formattedDate;
    }
  }
  next();
};

const validateQuery = (request, response, next) => {
  const {
    status = "",
    priority = "",
    category = "",
    date = "",
  } = request.query;
  if (priority !== "") {
    const possiblePriority = ["HIGH", "MEDIUM", "LOW"];
    if (possiblePriority.includes(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (status !== "") {
    const possibleStatus = ["TO DO", "IN PROGRESS", "DONE"];
    if (possibleStatus.includes(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (category !== "") {
    const possibleCategory = ["WORK", "HOME", "LEARNING"];
    if (possibleCategory.includes(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (date !== "") {
    const n = date.search(
      /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/i
    );
    if (n === -1) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      request.query.date = formattedDate;
    }
  }
  next();
};

// api 1 get todos by priority
app.get("/todos/", validateQuery, async (request, response) => {
  try {
    const {
      status = "",
      priority = "",
      search_q = "",
      category = "",
    } = request.query;
    const todoQuery = `select id,todo,priority,category,status,due_date as dueDate from todo where status like '%${status}%' and priority like '%${priority}%' and todo like '%${search_q}%' and category like '%${category}%';`;
    const todos = await db.all(todoQuery);
    response.send(todos);
  } catch (error) {}
});

//api 2 get todo by id
app.get("/todos/:todoId", async (request, response) => {
  try {
    const { todoId } = request.params;
    const aTodoQuery = `select id,todo,priority,category,status,due_date as dueDate from todo where id = ${todoId};`;
    const aTodo = await db.get(aTodoQuery);
    response.send(aTodo);
  } catch (error) {}
});

//api 3 get a tod with specific date
app.get("/agenda/", validateQuery, async (request, response) => {
  try {
    const { date } = request.query;
    const newDate = new Date(date);
    const fDate = `0${newDate.getDate()}`.slice(-2);
    const month = `0${newDate.getMonth() + 1}`.slice(-2);
    const year = `0${newDate.getFullYear()}`.slice(-4);
    const formattedDate = `${year}-${month}-${fDate}`;
    const getWithDate = `select id,todo,priority,category,status,due_date as dueDate from todo where due_date like '${formattedDate}';`;
    const todo = await db.all(getWithDate);
    response.send(todo);
  } catch (error) {}
});

// api 4 post a todo
app.post("/todos/", validate, async (request, response) => {
  try {
    const { id, todo, priority, status, category, dueDate } = request.body;

    const createTodoQuery = `insert into todo(id,todo,priority,status,category,due_date)
    values(${id},'${todo}','${priority}','${status}','${category}', '${dueDate}');`;
    const r = await db.run(createTodoQuery);
    response.send("Todo Successfully Added");
  } catch (error) {}
});

//api 4 update todo
app.put("/todos/:todoId/", validate, async (request, response) => {
  try {
    const { todoId } = request.params;
    const {
      todo = "",
      priority = "",
      status = "",
      category = "",
      dueDate = "",
    } = request.body;
    let updateTodoQuery;
    if (todo != "") {
      updateTodoQuery = `update todo set todo='${todo}' where id=${todoId};`;
      const r = await db.run(updateTodoQuery);
      response.send("Todo Updated");
    }
    if (priority != "") {
      updatePriorityQuery = `update todo set priority='${priority}' where id=${todoId};`;
      const r = await db.run(updatePriorityQuery);
      response.send("Priority Updated");
    }
    if (status != "") {
      updateStatusQuery = `update todo set status='${status}' where id=${todoId};`;
      const r = await db.run(updateStatusQuery);
      response.send("Status Updated");
    }
    if (category != "") {
      updateStatusQuery = `update todo set category='${category}' where id=${todoId};`;
      const r = await db.run(updateStatusQuery);
      response.send("Category Updated");
    }
    if (dueDate != "") {
      updateStatusQuery = `update todo set due_date='${dueDate}' where id=${todoId};`;
      const r = await db.run(updateStatusQuery);
      response.send("Due Date Updated");
    }
  } catch (error) {}
});

//api 5 delete todo by id
app.delete("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const deleteTodoQuery = `delete from todo where id = ${todoId};`;
    const re = await db.run(deleteTodoQuery);
    const { changes } = re;
    if (changes > 0) {
      response.send("Todo Deleted");
    } else {
      response.status(400);
      response.send();
    }
  } catch (error) {}
});

module.exports = app;
