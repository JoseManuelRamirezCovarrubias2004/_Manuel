// src/pages/puestos/datos/funcionesPuestos.js

export const FUNCIONES_POR_PUESTO = {
    // ==================== VENTAS ====================
    "Asesor de Ventas Nuevos": {
        funciones: [
            {
                nombre: "Atención al cliente en sala de ventas",
                subactividades: [
                    "Recibir al cliente de manera cordial y profesional",
                    "Identificar necesidades y preferencias del cliente",
                    "Presentar las opciones de vehículos disponibles",
                    "Resolver dudas sobre características y precios"
                ]
            },
            {
                nombre: "Pruebas de manejo",
                subactividades: [
                    "Verificar licencia de conducir del cliente",
                    "Explicar la ruta y características del vehículo",
                    "Acompañar durante la prueba de manejo",
                    "Resolver dudas técnicas durante el recorrido"
                ]
            },
            {
                nombre: "Negociación y cierre de ventas",
                subactividades: [
                    "Presentar opciones de financiamiento",
                    "Negociar precios y promociones",
                    "Cerrar la venta de manera efectiva",
                    "Gestionar documentación de compra"
                ]
            },
            {
                nombre: "Seguimiento post-venta",
                subactividades: [
                    "Contactar al cliente después de la entrega",
                    "Resolver dudas sobre el funcionamiento del vehículo",
                    "Gestionar agendamiento de primer servicio",
                    "Mantener relación para futuras ventas"
                ]
            }
        ]
    },

    "Asesor de Ventas Seminuevos": {
        funciones: [
            {
                nombre: "Atención a clientes de seminuevos",
                subactividades: [
                    "Recibir y asesorar a clientes interesados en seminuevos",
                    "Presentar inventario disponible de vehículos usados",
                    "Explicar beneficios de la certificación de seminuevos"
                ]
            },
            {
                nombre: "Valuación de vehículos",
                subactividades: [
                    "Inspeccionar condiciones del vehículo",
                    "Investigar precios de mercado",
                    "Determinar valor comercial del vehículo",
                    "Documentar condiciones y kilometraje"
                ]
            },
            {
                nombre: "Negociación y cierre",
                subactividades: [
                    "Negociar precio final con el cliente",
                    "Gestionar financiamiento para seminuevos",
                    "Coordinar entrega del vehículo",
                    "Realizar trámites de transferencia"
                ]
            }
        ]
    },

    "Gerente de Ventas": {
        funciones: [
            {
                nombre: "Liderazgo del equipo de ventas",
                subactividades: [
                    "Supervisar el desempeño de los asesores",
                    "Realizar reuniones de seguimiento diarias",
                    "Motivar al equipo para alcanzar metas",
                    "Resolver conflictos internos"
                ]
            },
            {
                nombre: "Planificación estratégica",
                subactividades: [
                    "Establecer metas mensuales y anuales",
                    "Desarrollar estrategias de venta",
                    "Analizar mercado y competencia",
                    "Ajustar tácticas según resultados"
                ]
            },
            {
                nombre: "Gestión de inventario",
                subactividades: [
                    "Monitorear rotación de vehículos",
                    "Coordinar pedidos a planta",
                    "Gestionar vehículos de demostración",
                    "Controlar stock por modelo y color"
                ]
            },
            {
                nombre: "Capacitación y desarrollo",
                subactividades: [
                    "Identificar necesidades de capacitación",
                    "Coordinar entrenamientos internos",
                    "Evaluar progreso del equipo",
                    "Implementar mejoras continuas"
                ]
            }
        ]
    },

    // ==================== SERVICIO ====================
    "Asesor de Servicio": {
        funciones: [
            {
                nombre: "Recepción de vehículos",
                subactividades: [
                    "Recibir al cliente de manera cordial",
                    "Registrar datos del vehículo y cliente",
                    "Identificar necesidades de servicio",
                    "Generar orden de reparación"
                ]
            },
            {
                nombre: "Diagnóstico y cotización",
                subactividades: [
                    "Realizar diagnóstico inicial",
                    "Cotizar reparaciones necesarias",
                    "Explicar al cliente los trabajos requeridos",
                    "Obtener autorización del cliente"
                ]
            },
            {
                nombre: "Seguimiento de reparaciones",
                subactividades: [
                    "Monitorear avance de reparaciones",
                    "Comunicar novedades al cliente",
                    "Coordinar con taller para cumplir tiempos",
                    "Verificar calidad del trabajo"
                ]
            },
            {
                nombre: "Entrega de vehículo",
                subactividades: [
                    "Revisar vehículo antes de la entrega",
                    "Explicar trabajos realizados al cliente",
                    "Entregar factura y documentación",
                    "Resolver dudas finales del cliente"
                ]
            }
        ]
    },

    "Técnico Mecánico": {
        funciones: [
            {
                nombre: "Diagnóstico de fallas",
                subactividades: [
                    "Conectar equipo de diagnóstico computarizado",
                    "Interpretar códigos de error",
                    "Realizar pruebas mecánicas",
                    "Identificar causa raíz de fallas"
                ]
            },
            {
                nombre: "Reparación y mantenimiento",
                subactividades: [
                    "Realizar reparaciones según manual técnico",
                    "Cambiar piezas desgastadas o dañadas",
                    "Realizar mantenimientos preventivos",
                    "Probar sistemas reparados"
                ]
            },
            {
                nombre: "Control de calidad",
                subactividades: [
                    "Verificar que la reparación sea correcta",
                    "Realizar pruebas de funcionamiento",
                    "Documentar trabajos realizados",
                    "Asegurar cumplimiento de estándares"
                ]
            },
            {
                nombre: "Mantenimiento de área de trabajo",
                subactividades: [
                    "Mantener orden y limpieza en el taller",
                    "Cuidar herramientas y equipo",
                    "Reportar equipo en mal estado",
                    "Cumplir normas de seguridad"
                ]
            }
        ]
    },

    "Jefe de Taller": {
        funciones: [
            {
                nombre: "Supervisión de operaciones",
                subactividades: [
                    "Coordinar actividades diarias del taller",
                    "Asignar trabajos a técnicos según especialidad",
                    "Supervisar cumplimiento de tiempos",
                    "Resolver problemas operativos"
                ]
            },
            {
                nombre: "Control de calidad",
                subactividades: [
                    "Inspeccionar trabajos terminados",
                    "Identificar áreas de mejora",
                    "Implementar medidas correctivas",
                    "Reducir reparaciones repetidas"
                ]
            },
            {
                nombre: "Gestión de recursos",
                subactividades: [
                    "Controlar herramientas y equipo",
                    "Gestionar inventario de consumibles",
                    "Coordinar mantenimiento de equipo",
                    "Optimizar uso de recursos"
                ]
            },
            {
                nombre: "Capacitación del equipo",
                subactividades: [
                    "Identificar necesidades de capacitación",
                    "Coordinar entrenamientos técnicos",
                    "Evaluar competencias del personal",
                    "Promover mejora continua"
                ]
            }
        ]
    },

    // ==================== ADMINISTRACIÓN ====================
    "Contador General": {
        funciones: [
            {
                nombre: "Registro contable",
                subactividades: [
                    "Registrar operaciones diarias",
                    "Clasificar ingresos y egresos",
                    "Mantener libros contables actualizados",
                    "Conciliar cuentas bancarias"
                ]
            },
            {
                nombre: "Elaboración de estados financieros",
                subactividades: [
                    "Preparar balance general mensual",
                    "Elaborar estado de resultados",
                    "Generar reportes de flujo de efectivo",
                    "Presentar informes a dirección"
                ]
            },
            {
                nombre: "Cumplimiento fiscal",
                subactividades: [
                    "Calcular impuestos mensuales",
                    "Preparar declaraciones fiscales",
                    "Gestionar obligaciones ante el SAT",
                    "Mantener documentación fiscal en orden"
                ]
            },
            {
                nombre: "Auditoría y control interno",
                subactividades: [
                    "Realizar auditorías internas periódicas",
                    "Detectar irregularidades contables",
                    "Implementar controles internos",
                    "Coordinar auditorías externas"
                ]
            }
        ]
    },

    "Auxiliar Contable": {
        funciones: [
            {
                nombre: "Registro de facturas",
                subactividades: [
                    "Capturar facturas de proveedores",
                    "Verificar datos fiscales",
                    "Clasificar por tipo de gasto",
                    "Archivar documentos contables"
                ]
            },
            {
                nombre: "Conciliaciones bancarias",
                subactividades: [
                    "Descargar estados de cuenta",
                    "Conciliar movimientos bancarios",
                    "Identificar diferencias",
                    "Reportar inconsistencias"
                ]
            },
            {
                nombre: "Apoyo en elaboración de reportes",
                subactividades: [
                    "Recopilar información para reportes",
                    "Preparar cédulas de trabajo",
                    "Actualizar bases de datos contables",
                    "Apoyar en cierres mensuales"
                ]
            }
        ]
    },

    // ==================== OPERACIONES ====================
    "Lavador": {
        funciones: [
            {
                nombre: "Lavado exterior de vehículos",
                subactividades: [
                    "Preparar materiales y productos de limpieza",
                    "Aplicar productos de manera adecuada",
                    "Secar y pulir superficies",
                    "Verificar calidad del lavado"
                ]
            },
            {
                nombre: "Limpieza interior de vehículos",
                subactividades: [
                    "Aspirar tapetes y asientos",
                    "Limpiar tablero y consola",
                    "Aplicar aromatizantes",
                    "Dejar el vehículo impecable"
                ]
            },
            {
                nombre: "Mantenimiento de área de trabajo",
                subactividades: [
                    "Organizar productos de limpieza",
                    "Mantener orden en el área",
                    "Reportar faltantes de insumos",
                    "Cuidar equipo y herramientas"
                ]
            }
        ]
    },

    // ==================== RECURSOS HUMANOS ====================
    "Recursos Humanos": {
        funciones: [
            {
                nombre: "Reclutamiento y selección",
                subactividades: [
                    "Publicar vacantes en plataformas",
                    "Filtrar currículums recibidos",
                    "Coordinar entrevistas con candidatos",
                    "Realizar evaluaciones psicométricas"
                ]
            },
            {
                nombre: "Administración de personal",
                subactividades: [
                    "Gestionar altas y bajas en el IMSS",
                    "Calcular nómina mensual",
                    "Administrar vacaciones y permisos",
                    "Mantener expedientes actualizados"
                ]
            },
            {
                nombre: "Capacitación y desarrollo",
                subactividades: [
                    "Identificar necesidades de capacitación",
                    "Coordinar cursos internos",
                    "Evaluar efectividad de capacitaciones",
                    "Llevar registro de entrenamientos"
                ]
            },
            {
                nombre: "Relaciones laborales",
                subactividades: [
                    "Atender quejas del personal",
                    "Resolver conflictos laborales",
                    "Aplicar políticas internas",
                    "Gestionar despidos y liquidaciones"
                ]
            }
        ]
    }
};

// Función para obtener funciones de un puesto
export const obtenerFunciones = (nombrePuesto) => {
    return FUNCIONES_POR_PUESTO[nombrePuesto] || {
        funciones: [
            {
                nombre: "Cumplir con las responsabilidades del puesto",
                subactividades: [
                    "Realizar las actividades asignadas por el jefe inmediato",
                    "Cumplir con los horarios establecidos",
                    "Mantener comunicación efectiva con el equipo",
                    "Reportar avances y novedades oportunamente",
                    "Participar en capacitaciones y reuniones"
                ]
            },
            {
                nombre: "Atención y servicio",
                subactividades: [
                    "Brindar atención de calidad a clientes internos y externos",
                    "Resolver dudas y quejas de manera profesional",
                    "Mantener una actitud positiva y colaborativa",
                    "Cumplir con las políticas de la empresa"
                ]
            }
        ]
    };
};