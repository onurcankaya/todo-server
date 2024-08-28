import express from "express";
import cors from "cors";

import pool from "./db";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// route to add a new todo
app.post("/todos", async (req, res) => {
  const { title, description } = req.body;

  try {
    const newTodo = await pool.query(
      "INSERT INTO todos (title, description) VALUES ($1, $2) RETURNING *",
      [title, description]
    );

    res.json(newTodo.rows[0]);
  } catch (error) {
    console.error((error as Error).message);
    res.status(500).send("Error creating todo");
  }
});

// route to get all todos
app.get("/todos", async (req, res) => {
  try {
    const allTodos = await pool.query("SELECT * from todos");
    res.json(allTodos.rows);
  } catch (error) {
    console.log((error as Error).message);
    res.status(500).send("Error fetching todos");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
