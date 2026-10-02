# Frontend - Solución Tecnológica Educativa Nutricional Estudiantil (Comfandi)

## Descripción
Interfaz web moderna desarrollada para el registro, evaluación y seguimiento del estado nutricional de los estudiantes de la Red de Colegios Comfandi.

## Tecnologías Utilizadas
- **HTML5:** Estructura semántica y accesible.
- **CSS3:** Diseño responsivo con Vanilla CSS, variables de diseño, glassmorphism y micro-animaciones.
- **JavaScript (ES6+):** Conexión con el servidor backend FastAPI, cálculo de IMC en tiempo real, tab switching, simulador de hardware (Web Audio API para buzzer) y exportación de reportes CSV.

## Características Principales
- **Panel de Control (Dashboard):** Métricas globales de la institución (total estudiantes, promedio de IMC, distribución por clasificación ponderal).
- **Formulario de Registro:** Captura de datos antropométricos con cálculo automático del IMC e identificación inmediata de alertas.
- **Directorio de Seguimiento:** Búsqueda en tiempo real y filtrado por clasificación o grado con persistencia en archivo de texto plano.
- **Simulador de Computación Física:** Interacción con sensores ultrasónicos simulados (Micro:bit / ESP32 / Arduino), LEDs de estado y buzzer sonoro PWM.
- **Guía Pedagógica Nutricional:** Orientaciones y recomendaciones educativas de salud para docentes y comunidad escolar.
