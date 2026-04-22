require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3127;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initDB() {
  try {
    const client = await pool.connect();
    console.log('Conexion a Supabase/PostgreSQL exitosa');
    client.release();
  } catch (error) {
    throw error;
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/clientes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM clientes ORDER BY id_cliente ASC'
    );

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al listar clientes',
      error: error.message
    });
  }
});

app.get('/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM clientes WHERE id_cliente = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Cliente no encontrado'
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al buscar cliente',
      error: error.message
    });
  }
});

app.post('/guardar-cliente', async (req, res) => {
  try {
    const { nombres, apellidos, direccion, telefono } = req.body;

    if (!nombres || !apellidos || !direccion || !telefono) {
      return res.status(400).json({
        mensaje: 'Todos los campos son obligatorios'
      });
    }

    const result = await pool.query(
      `INSERT INTO clientes (nombres, apellidos, direccion, telefono)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nombres, apellidos, direccion, telefono]
    );

    res.status(201).json({
      mensaje: 'Cliente guardado correctamente',
      cliente: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al guardar cliente',
      error: error.message
    });
  }
});

app.put('/actualizar-cliente/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, direccion, telefono } = req.body;

    if (!nombres || !apellidos || !direccion || !telefono) {
      return res.status(400).json({
        mensaje: 'Todos los campos son obligatorios'
      });
    }

    const result = await pool.query(
      `UPDATE clientes
       SET nombres = $1, apellidos = $2, direccion = $3, telefono = $4
       WHERE id_cliente = $5
       RETURNING *`,
      [nombres, apellidos, direccion, telefono, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Cliente no encontrado'
      });
    }

    res.status(200).json({
      mensaje: 'Cliente actualizado correctamente',
      cliente: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar cliente',
      error: error.message
    });
  }
});

app.delete('/eliminar-cliente/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM clientes WHERE id_cliente = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        mensaje: 'Cliente no encontrado'
      });
    }

    res.status(200).json({
      mensaje: 'Cliente eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar cliente',
      error: error.message
    });
  }
});

initDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor escuchando en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo conectar a Supabase/PostgreSQL:', error.message);
  });