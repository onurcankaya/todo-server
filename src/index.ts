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

    res.status(200).json(newTodo.rows[0]);
  } catch (error) {
    console.error((error as Error).message);
    res.status(500).send("Error creating todo");
  }
});

// route to get all todos
app.get("/todos", async (req, res) => {
  try {
    const allTodos = await pool.query("SELECT * from todos");
    res.status(200).json(allTodos.rows);
  } catch (error) {
    console.log((error as Error).message);
    res.status(500).send("Error fetching todos");
  }
});

// route to delete a todo
app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    "DELETE FROM todos WHERE id = $1 RETURNING *",
    [id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: "Todo not found" });
  }

  res
    .status(200)
    .json({ message: "Todo deleted successfully", todo: result.rows[0] });

  try {
  } catch (error) {
    console.error((error as Error).message);
    res.status(500).json({ message: "Error deleting todo" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
