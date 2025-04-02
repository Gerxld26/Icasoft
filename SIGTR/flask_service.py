import os
import sys
import ctypes
import subprocess
import threading
from flask import Flask, jsonify

app = Flask(__name__)

# Estado global de reparación
repair_status = {"status": "idle", "message": "Esperando acción de reparación."}

# Verificar permisos de administrador
def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

if not is_admin():
    print("[ERROR] La aplicación requiere permisos de administrador.")
    sys.exit(1)

@app.route('/repair_disk', methods=['POST'])
def repair_disk():
    global repair_status

    if repair_status["status"] == "in_progress":
        return jsonify({
            "status": "in_progress",
            "message": "La reparación ya está en curso. Por favor, espera..."
        })

    repair_status["status"] = "in_progress"
    repair_status["message"] = "Ejecutando reparación en disco. Por favor, espera..."
    print("[INFO] Reparación iniciada...")

    def run_disk_repair():
        global repair_status
        try:
            # Comando para ejecutar chkdsk
            command = ["chkdsk", "C:", "/F", "/R", "/X"]
            print(f"[INFO] Ejecutando comando: {' '.join(command)}")

            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # Captura de salida en tiempo real
            for line in process.stdout:
                print("[CHKDSK STDOUT]", line.strip())
                if "No se puede bloquear la unidad actual" in line or "porque otro proceso ya está usando" in line:
                    repair_status["status"] = "scheduled"
                    repair_status["message"] = "El disco está en uso. Reparación programada para el próximo reinicio."
                    print("[INFO] Reparación programada para el próximo reinicio.")
                    process.kill()  # Detener el proceso
                    return

            process.wait(timeout=300)  # Máximo de 5 minutos para ejecutar chkdsk
            exit_code = process.returncode

            # Validar resultado del comando
            if exit_code == 0:
                repair_status["status"] = "completed"
                repair_status["message"] = "Reparación completada con éxito."
                print("[INFO] Reparación completada con éxito.")
            else:
                repair_status["status"] = "error"
                repair_status["message"] = "Error durante la reparación."
                print("[ERROR] Error durante la reparación.")
        except subprocess.TimeoutExpired:
            repair_status["status"] = "error"
            repair_status["message"] = "Tiempo de espera excedido para la reparación."
            print("[ERROR] Tiempo de espera excedido para la reparación.")
            process.kill()
        except Exception as e:
            repair_status["status"] = "error"
            repair_status["message"] = f"Error inesperado: {str(e)}"
            print("[ERROR] Error inesperado:", str(e))
        finally:
            print("[INFO] Estado final de reparación:", repair_status)

    repair_thread = threading.Thread(target=run_disk_repair, daemon=True)
    repair_thread.start()

    return jsonify({
        "status": "in_progress",
        "message": "Reparación en curso. Puedes verificar el estado."
    })

@app.route('/repair_status', methods=['GET'])
def repair_status_endpoint():
    global repair_status
    print("[INFO] Estado actual:", repair_status)
    return jsonify(repair_status)

if __name__ == '__main__':  
    app.run(host='0.0.0.0', port=5001, debug=True)
