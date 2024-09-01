import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import pool from "./db";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is not set");
}

// route to register a new user
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );

    res.status(201).json({ user: newUser.rows[0] });
  } catch (error) {
    console.error((error as Error).message);
    res.status(500).send("Error registering user");
  }
});

// route to login user
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // check if a user with the email exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Email is not registered" });
    }

    // check if password is correct
    const isMatch = await bcrypt.compare(password, user.rows[0].password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    // create and send JWT
    const token = jwt.sign({ userId: user.rows[0].id }, jwtSecret, {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error((error as Error).message);
    res.status(500).send("Error logging in");
  }
});

// route to add a new todo
app.post("/todos", async (req, res) => {
  const { title, description } = req.body;

  try {
    const newTodo = await pool.query(
      "INSERT INTO todos (title, description) VALUES ($1, $2) RETURNING *",
      [title, description]
    );

    res.status(201).json(newTodo.rows[0]);
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

// route to update a todo
app.put("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, is_completed } = req.body;

  try {
    const result = await pool.query(
      `UPDATE todos
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          is_completed = COALESCE($3, is_completed),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
      `,
      [title, description, is_completed, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res
      .status(200)
      .json({ message: "Todo updated successfully", todo: result.rows[0] });
  } catch (error) {
    console.error("Error updating todo:", error);
    res.status(500).json({ message: "Server error" });
  }
});
