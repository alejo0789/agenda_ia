"""
Script para ejecutar todas las pruebas del módulo de control de acceso
"""
import subprocess
import sys
import os

def run_tests():
    """Ejecutar todas las pruebas con pytest"""
    print("="*70)
    print("  EJECUTANDO PRUEBAS DEL MÓDULO DE CONTROL DE ACCESO")
    print("="*70)
    print()
    
    # Cambiar al directorio del backend
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Ejecutar pytest
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "tests/",
            "-v",
            "--tb=short",
            "--color=yes"
        ],
        capture_output=False
    )
    
    print()
    print("="*70)
    if result.returncode == 0:
        print("  ✓ TODAS LAS PRUEBAS PASARON EXITOSAMENTE")
    else:
        print("  ✗ ALGUNAS PRUEBAS FALLARON")
    print("="*70)
    
    return result.returncode

def run_tests_with_coverage():
    """Ejecutar pruebas con reporte de cobertura"""
    print("="*70)
    print("  EJECUTANDO PRUEBAS CON COBERTURA DE CÓDIGO")
    print("="*70)
    print()
    
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "tests/",
            "-v",
            "--cov=app",
            "--cov-report=html",
            "--cov-report=term-missing"
        ],
        capture_output=False
    )
    
    print()
    print("="*70)
    if result.returncode == 0:
        print("  ✓ PRUEBAS COMPLETADAS")
        print("  Reporte de cobertura generado en: htmlcov/index.html")
    else:
        print("  ✗ ALGUNAS PRUEBAS FALLARON")
    print("="*70)
    
    return result.returncode

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--coverage":
        sys.exit(run_tests_with_coverage())
    else:
        sys.exit(run_tests())
