/**
 * ML Predictor Service Manager
 * Automatically starts and manages the FastAPI ML predictor service
 * Runs on port 8000 by default
 */

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mlProcess = null

/**
 * Checks if the model file exists
 * @returns {boolean}
 */
const checkModelExists = () => {
  const modelPath = path.join(__dirname, '../../..', 'ml-predictor', 'env_forecast_model.pkl')
  return fs.existsSync(modelPath)
}

/**
 * Trains the ML model if it doesn't exist
 * @returns {Promise<boolean>}
 */
const trainModelIfNeeded = () => {
  return new Promise((resolve) => {
    if (checkModelExists()) {
      console.log('✓ ML model file found at ml-predictor/env_forecast_model.pkl')
      resolve(true)
      return
    }

    console.log('⏳ Training ML model... (this may take a minute)')
    const mlPredictorDir = path.join(__dirname, '../../..', 'ml-predictor')
    const isWin = process.platform === 'win32'
    const pythonPath = isWin ? path.join(mlPredictorDir, '.venv', 'Scripts', 'python.exe') : path.join(mlPredictorDir, '.venv', 'bin', 'python')
    const pythonCmd = fs.existsSync(pythonPath) ? pythonPath : 'python'

    const trainProcess = spawn(`"${pythonCmd}"`, ['train_model.py'], {
      cwd: mlPredictorDir,
      stdio: 'inherit',
      shell: true,
    })

    trainProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✓ ML model training completed successfully')
        resolve(true)
      } else {
        console.error('✗ ML model training failed with code:', code)
        resolve(false)
      }
    })

    trainProcess.on('error', (error) => {
      console.error('✗ Error training ML model:', error.message)
      resolve(false)
    })
  })
}

/**
 * Starts the ML predictor service (FastAPI with uvicorn)
 * @returns {Promise<void>}
 */
export const startMLPredictorService = async () => {
  return new Promise((resolve, reject) => {
    console.log('\n🤖 Starting ML Predictor Service...')

    // First, ensure model is trained
    trainModelIfNeeded()
      .then((trained) => {
        if (!trained) {
          console.warn(
            '⚠️  Warning: ML model training may have issues, but proceeding anyway...'
          )
        }

        const mlPredictorDir = path.join(__dirname, '../../..', 'ml-predictor')
        const isWin = process.platform === 'win32'
        const pythonPath = isWin ? path.join(mlPredictorDir, '.venv', 'Scripts', 'python.exe') : path.join(mlPredictorDir, '.venv', 'bin', 'python')
        const pythonCmd = fs.existsSync(pythonPath) ? pythonPath : 'python'

        // Spawn uvicorn process using python -m
        mlProcess = spawn(`"${pythonCmd}"`, ['-m', 'uvicorn', 'app:app', '--host', '0.0.0.0', '--port', '8000'], {
          cwd: mlPredictorDir,
          stdio: 'pipe',
          shell: true,
        })

        // Track startup
        let startupComplete = false

        mlProcess.stdout.on('data', (data) => {
          const output = data.toString()
          console.log(`[ML] ${output.trim()}`)

          // Detect successful startup
          if (output.includes('Uvicorn running on') || output.includes('Application startup complete')) {
            if (!startupComplete) {
              startupComplete = true
              console.log('✓ ML Predictor Service started successfully on port 8000')
              resolve()
            }
          }
        })

        mlProcess.stderr.on('data', (data) => {
          console.error(`[ML Error] ${data.toString().trim()}`)
        })

        mlProcess.on('close', (code) => {
          console.warn(`[ML] Predictor service exited with code ${code}`)
          mlProcess = null
        })

        mlProcess.on('error', (error) => {
          console.error('✗ Failed to start ML Predictor service:', error.message)
          if (!startupComplete) {
            reject(error)
          }
        })

        // Timeout if service doesn't start within 30 seconds
        setTimeout(() => {
          if (!startupComplete) {
            console.warn(
              '⚠️  ML Predictor Service startup timed out, but backend will continue to run'
            )
            resolve()
          }
        }, 30000)
      })
      .catch((error) => {
        console.error('✗ Error during ML setup:', error.message)
        reject(error)
      })
  })
}

/**
 * Stops the ML predictor service gracefully
 * @returns {Promise<void>}
 */
export const stopMLPredictorService = () => {
  return new Promise((resolve) => {
    if (mlProcess) {
      console.log('Stopping ML Predictor Service...')
      mlProcess.kill('SIGTERM')

      // Force kill after 5 seconds if still running
      const forceKillTimeout = setTimeout(() => {
        if (mlProcess) {
          mlProcess.kill('SIGKILL')
        }
      }, 5000)

      mlProcess.on('close', () => {
        clearTimeout(forceKillTimeout)
        mlProcess = null
        console.log('✓ ML Predictor Service stopped')
        resolve()
      })
    } else {
      resolve()
    }
  })
}

/**
 * Check if ML service is running
 * @returns {boolean}
 */
export const isMLPredictorRunning = () => {
  return mlProcess !== null && !mlProcess.killed
}
