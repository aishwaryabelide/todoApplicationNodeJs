const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
let db = null;

//initialize DB and Server
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//convert to response object
const convertToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

//get all todos based on request Query
app.get("/todos/", async (request, response) => {
  const requestBody = request.query;

  switch (true) {
    case requestBody.status !== undefined:
      const status = requestBody.status;
      //   console.log(status);
      if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        const selectStatusQuery = `
        SELECT * FROM todo WHERE status = '${requestBody.status}';`;
        const dbStatus = await db.all(selectStatusQuery);
        response.send(
          dbStatus.map((eachObject) => convertToResponseObject(eachObject))
        );
      }

      break;

    case requestBody.priority !== undefined:
      const priority = requestBody.priority;
      //   console.log(priority);
      if (priority !== "HIGH" && priority !== "MEDIUM" && priority !== "LOW") {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        const selectPriorityQuery = `
        SELECT * FROM todo WHERE priority = '${requestBody.priority}';`;
        const dbPriority = await db.all(selectPriorityQuery);
        response.send(
          dbPriority.map((eachObject) => convertToResponseObject(eachObject))
        );
      }

      break;

    case requestBody.priority !== undefined && requestBody.status !== undefined:
      const selectPriorityStatusQuery = `
        SELECT * FROM todo WHERE priority = '${requestBody.priority}' AND status = '${requestBody.status}';`;
      const dbPriorityStatus = await db.all(selectPriorityStatusQuery);
      response.send(
        dbPriorityStatus.map((eachObject) =>
          convertToResponseObject(eachObject)
        )
      );
      break;

    case requestBody.search_q !== undefined:
      const selectSearchQuery = `SELECT * FROM todo WHERE todo LIKE '%${requestBody.search_q}%';`;
      const dbSearch_q = await db.all(selectSearchQuery);
      response.send(
        dbSearch_q.map((eachObject) => convertToResponseObject(eachObject))
      );
      break;

    case requestBody.category !== undefined && requestBody.status !== undefined:
      const selectCategoryStatusQuery = `
        SELECT * FROM todo WHERE category = '${requestBody.category}' AND status = '${requestBody.status}';`;
      const dbCategoryStatus = await db.all(selectCategoryStatusQuery);
      response.send(
        dbCategoryStatus.map((eachObject) =>
          convertToResponseObject(eachObject)
        )
      );
      break;

    case requestBody.category !== undefined:
      const category = requestBody.category;
      if (
        category !== "WORK" &&
        category !== "HOME" &&
        category !== "LEARNING"
      ) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        const selectCategory = `SELECT * FROM todo WHERE category = '${requestBody.category}';`;
        const dbCategory = await db.all(selectCategory);
        response.send(
          dbCategory.map((eachObject) => convertToResponseObject(eachObject))
        );
      }

      break;

    case requestBody.category !== undefined &&
      requestBody.priority !== undefined:
      const selectCategoryPriorityQuery = `
        SELECT * FROM todo WHERE category = '${requestBody.category}' AND priority = '${requestBody.priority}';`;
      const dbCategoryPriority = await db.all(selectCategoryPriorityQuery);
      response.send(
        dbCategoryPriority.map((eachObject) =>
          convertToResponseObject(eachObject)
        )
      );
      break;
  }
});

//Get todo based on id API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const selectTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const dbUser = await db.get(selectTodoQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid Todo Id");
  } else {
    response.send(convertToResponseObject(dbUser));
  }
});

//Get Todo according to Duedate API
app.get("/agenda", async (request, response) => {
  const { date } = request.query;
  const getDueDateQuery = `
        SELECT * FROM todo WHERE due_date = '${date}';`;
  const dbUser = await db.all(getDueDateQuery);
  response.send(
    dbUser.map((eachObject) => convertToResponseObject(eachObject))
  );
});

//create Todo API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    const selectTodoQuery = `SELECT * FROM todo WHERE id = ${id};`;
    const dbUser1 = await db.get(selectTodoQuery);

    if (dbUser1 === undefined) {
      const createTodoQuery = `
        INSERT INTO todo(id, todo, priority, status, category, due_date)
        VALUES(${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}'); `;
      const dbUser = await db.run(createTodoQuery);
      response.send("Todo Successfully Added");
    } else {
      response.status(400);
      response.send("Todo already Exists");
    }
  }
});

//update todo based on query parameters
app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  // check what is present in the request body
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  //check if todo ID exists in database
  const selectTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const dbUser1 = await db.get(selectTodoQuery);
  if (dbUser1 === undefined) {
    response.status(400);
    response.send("Invalid Todo Id");
  } else {
    const {
      status = dbUser1.status,
      priority = dbUser1.priority,
      todo = dbUser1.todo,
      category = dbUser1.category,
      dueDate = dbUser1.due_date,
    } = request.body;
    if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (
      priority !== "HIGH" &&
      priority !== "MEDIUM" &&
      priority !== "LOW"
    ) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (
      category !== "WORK" &&
      category !== "HOME" &&
      category !== "LEARNING"
    ) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const updateTodoQuery = `UPDATE todo SET 
                status = '${status}',
                priority = '${priority}',
                todo = '${todo}',
                category = '${category}',
                due_date = '${dueDate}'
                WHERE id = ${todoId};`;
      const dbUser = await db.run(updateTodoQuery);
      response.send(`${updateColumn} Updated`);
    }
  }
});

//Delete todo based on todoId
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const selectTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const isTodoExists = await db.get(selectTodoQuery);
  if (isTodoExists === undefined) {
    response.send("Todo Doesn't Exists");
    response.status(400);
  } else {
    const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
    const dbUser2 = await db.run(deleteTodoQuery);
    response.send("Todo Deleted");
  }
});

module.exports = app;
