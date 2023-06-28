const express = require("express");
const path = require("path");
const { open } = require("sqlite");

const isMatch = require("date-fns/isMatch");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category, due_date } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                        SELECT * FROM todo
                        WHERE 
                        status='${status}'
                        AND priority='${priority}'
                    ;`;
          const data = await db.all(getTodoQuery);
          response.send(
            data.map((eachData) => convertDbObjectToResponseObject(eachData))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                        SELECT * FROM todo
                        WHERE 
                        status='${status}'
                        AND category='${category}'
                    ;`;
          const data = await db.all(getTodoQuery);
          response.send(
            data.map((eachData) => convertDbObjectToResponseObject(eachData))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `
                        SELECT * FROM todo
                        WHERE 
                        category='${category}'
                        AND priority=='${priority}'
                    ;`;
          const data = await db.all(getTodoQuery);
          response.send(
            data.map((eachData) => convertDbObjectToResponseObject(eachData))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
        SELECT * FROM todo
        WHERE category='${category}';`;
        const data = await db.all(getTodoQuery);
        response.send(
          data.map((eachData) => convertDbObjectToResponseObject(eachData))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
        SELECT * FROM todo
        WHERE priority='${priority}';`;
        const data = await db.all(getTodoQuery);
        response.send(
          data.map((eachData) => convertDbObjectToResponseObject(eachData))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
        SELECT * FROM todo
        WHERE status='${status}';`;
        const data = await db.all(getTodoQuery);
        response.send(
          data.map((eachData) => convertDbObjectToResponseObject(eachData))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    default:
      getTodoQuery = `
        SELECT * FROM todo
        WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      response.send(
        data.map((eachData) => convertDbObjectToResponseObject(eachData))
      );
  }
});

//api2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `
    SELECT * FROM todo
    WHERE id=${todoId};`;
  const todoData = await db.get(getTodoIdQuery);
  response.send(convertDbObjectToResponseObject(todoData));
});

//api3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const getTodoIdQuery = `
        SELECT * FROM todo
        WHERE due_date='${newDate}';`;
    const todoData = await db.all(getTodoIdQuery);
    response.send(
      todoData.map((eachData) => convertDbObjectToResponseObject(eachData))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
// add post
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const getTodoIdQuery = `
    INSERT INTO
    todo (id, todo, priority, status, category, due_date)
    VALUES(${id},'${todo}', '${priority}', '${status}', '${category}', '${newDate}');`;
          await db.run(getTodoIdQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

// put
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedResult = "";
  const previousTodoQuery = `
 SELECT * FROM todo where id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = requestBody;

  let updatedQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updatedQuery = `
            UPDATE todo
            SET
                todo='${todo}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${dueDate}'
            WHERE id=${todoId};`;

        const updatedTodo = await db.run(updatedQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updatedQuery = `
            UPDATE todo
            SET
                todo='${todo}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${dueDate}'
            WHERE id=${todoId};`;

        const updatedTodo = await db.run(updatedQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updatedQuery = `
            UPDATE todo
            SET
                todo='${todo}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${dueDate}'
            WHERE id=${todoId};`;

        const updatedTodo = await db.run(updatedQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.todo !== undefined:
      updatedQuery = `
            UPDATE todo
            SET
                todo='${todo}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${dueDate}'
            WHERE id=${todoId};`;

      const updatedTodo = await db.run(updatedQuery);
      response.send("Todo Updated");

      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updatedQuery = `
            UPDATE todo
            SET
                todo='${todo}',
                priority='${priority}',
                status='${status}',
                category='${category}',
                due_date='${dueDate}'
            WHERE id=${todoId};`;

        const updatedTodo = await db.run(updatedQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
});

//delete
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getDeleteQuery = `
  DELETE FROM todo
  WHERE id=${todoId};`;
  const deletedTodo = await db.run(getDeleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
