import { z } from 'zod'

// ─── Auth ───────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombre: z.string().min(2, 'Nombre muy corto'),
})

// ─── Restaurantes ───────────────────────────────────────────────────────────
export const CreateRestauranteSchema = z.object({
  nombre: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  estado_suscripcion: z.enum(['activo', 'inactivo', 'trial']).default('activo'),
})

export const UpdateRestauranteSchema = CreateRestauranteSchema.partial()

// ─── Mesas ──────────────────────────────────────────────────────────────────
export const CreateMesaSchema = z.object({
  restaurante_id: z.string().uuid(),
  numero: z.string().min(1),
  capacidad: z.number().int().positive().default(4),
  tipo_espacio: z.enum(['comedor', 'billar', 'vip']),
})

export const UpdateMesaSchema = z.object({
  estado: z.enum(['disponible', 'ocupada', 'reservada', 'mantenimiento']).optional(),
  capacidad: z.number().int().positive().optional(),
  tipo_espacio: z.enum(['comedor', 'billar', 'vip']).optional(),
  numero: z.string().optional(),
})

// ─── Productos ──────────────────────────────────────────────────────────────
export const CreateProductoSchema = z.object({
  restaurante_id: z.string().uuid(),
  nombre: z.string().min(1),
  precio: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  categoria: z.string().optional(),
  es_por_tiempo: z.boolean().default(false),
})

export const UpdateProductoSchema = CreateProductoSchema.omit({ restaurante_id: true }).partial()

// ─── Reservas ───────────────────────────────────────────────────────────────
export const CreateReservaSchema = z.object({
  restaurante_id: z.string().uuid(),
  mesa_id: z.string().uuid().optional(),
  cliente_nombre: z.string().min(1),
  cantidad_personas: z.number().int().positive(),
  fecha_hora: z.string().datetime({ message: 'Formato ISO 8601 requerido' }),
})

export const UpdateReservaSchema = z.object({
  estado: z.enum(['pendiente', 'confirmada', 'cancelada', 'completada']),
})

// ─── Pedidos ─────────────────────────────────────────────────────────────────
export const CreatePedidoSchema = z.object({
  restaurante_id: z.string().uuid(),
  mesa_id: z.string().uuid().optional(),
  nombre_cliente_barra: z.string().optional(),
  moneda: z.string().default('USD'),
})

export const UpdatePedidoSchema = z.object({
  estado: z.enum(['abierto', 'en_preparacion', 'listo', 'cerrado', 'cancelado']).optional(),
})

export const AddItemPedidoSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().positive(),
  notas: z.string().optional(),
})

// ─── Pagos (flujo auditoría multi-moneda) ────────────────────────────────────
export const RegistrarPagoSchema = z.object({
  metodo_pago: z.enum(['efectivo', 'tarjeta', 'transferencia', 'cripto', 'otro']),
  monto_recibido: z.number().positive(),
  moneda: z.string().min(1, 'Moneda requerida'),
  referencia_pago: z.string().optional(),
})

export const VerificarPagoSchema = z.object({
  accion: z.enum(['aprobar', 'rechazar']),
  notas: z.string().optional(),
})

// ─── Configuración ───────────────────────────────────────────────────────────
export const UpdateConfigSchema = z.object({
  monedas_aceptadas: z.array(z.string()).min(1),
  moneda_base: z.string().min(1),
  tasas_cambio: z.record(z.string(), z.number()).default({}),
})
