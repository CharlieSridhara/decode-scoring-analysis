import { useState } from 'react'
import { ArrowLeft, UploadSimple, FloppyDisk, ClipboardTextIcon } from '@phosphor-icons/react'

import { parseMatchText } from '../utils/matchFormat'
import { readPaste } from '../utils/pasteService'
import { extractShareParams, splitLines, tryParseUrlish } from '../utils/shareImport'

function TournamentCreator({ onCancel, onTournamentCreated }) {
  const [tournamentName, setTournamentName] = useState('')
  const [tournamentDate, setTournamentDate] = useState('')
  const [uploadedMatches, setUploadedMatches] = useState([])
  const [showTextImport, setShowTextImport] = useState(false)
  const [textInput, setTextInput] = useState('')

  const importMatchFiles = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    let loadedMatches = []
    let loadedCount = 0

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          loadedMatches.push(data)
          loadedCount++

          if (loadedCount === files.length) {
            setUploadedMatches(prev => [...prev, ...loadedMatches])
          }
        } catch {
          alert(`Error loading ${file.name}. Please ensure it is a valid JSON file.`)
          loadedCount++
        }
      }
      reader.readAsText(file)
    })
  }

  const importFromText = async () => {
    try {
      const lines = splitLines(textInput)

      if (lines.length === 0) {
        alert("No valid match data found. Please check the format.")
        return
      }

      const newMatches = []

      for (const line of lines) {
        let parsedData = null

        if (tryParseUrlish(line)) {
          const { pasteKey, mt } = extractShareParams(line)
          try {
            if (pasteKey) {
              const b64Payload = await readPaste(pasteKey)
              const decodedText = atob(b64Payload)
              parsedData = parseMatchText(decodedText)
            } else if (mt) {
              const decodedText = atob(decodeURIComponent(mt))
              parsedData = parseMatchText(decodedText)
            }
          } catch {
            continue
          }
        } else {
          try {
            parsedData = parseMatchText(line)
          } catch {
            const { pasteKey } = extractShareParams(line)
            if (pasteKey) {
              try {
                const b64Payload = await readPaste(pasteKey)
                const decodedText = atob(b64Payload)
                parsedData = parseMatchText(decodedText)
              } catch {
                continue
              }
            }
          }
        }

        if (!parsedData || !parsedData.events || parsedData.events.length === 0) continue

        newMatches.push({
          startTime: parsedData.startTime || Date.now(),
          duration: parsedData.duration || null,
          teamNumber: parsedData.teamNumber,
          events: parsedData.events,
          notes: parsedData.notes || "",
        })
      }

      if (newMatches.length === 0) {
        alert("No valid match data found. Please check the format.")
        return
      }

      setUploadedMatches(prev => [...prev, ...newMatches])
      setShowTextImport(false)
      setTextInput("")
    } catch (e) {
      alert("Error parsing match data. Please check the format: " + e.message)
    }
  }

  const createTournament = () => {
    if (!tournamentName.trim()) {
      alert('Please enter a tournament name')
      return
    }
    if (!tournamentDate) {
      alert('Please select a tournament date')
      return
    }
    if (uploadedMatches.length === 0) {
      alert('Please upload at least one match')
      return
    }

    onTournamentCreated({
      name: tournamentName,
      date: tournamentDate,
      matches: uploadedMatches
    })
  }

  const removeMatch = (index) => {
    setUploadedMatches(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen p-3 sm:p-5 max-w-7xl mx-auto">
      <div className="my-6 sm:my-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-3xl sm:text-5xl font-bold">Create Tournament</h1>
        <button onClick={onCancel} className="btn w-full sm:w-auto justify-center">
          <ArrowLeft size={20} weight="bold" />
          Cancel
        </button>
      </div>

      <div className="bg-brand-bg border-2 border-brand-border p-4 sm:p-8">
        <div className="space-y-6 mb-8">
          <div>
            <label className="block font-semibold mb-2">Tournament Name</label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="w-full p-3 border-2 border-brand-border focus:border-brand-accent outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Tournament Date</label>
            <input
              type="date"
              value={tournamentDate}
              onChange={(e) => setTournamentDate(e.target.value)}
              className="w-full p-3 border-2 border-brand-border focus:border-brand-accent outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Upload Match Files ({uploadedMatches.length} uploaded)
            </label>
            <div className="flex gap-3 flex-wrap">
              <label className="btn w-full sm:w-auto justify-center">
                <UploadSimple weight="bold" size={20} />
                Upload Match JSON Files
                <input type="file" accept=".json" multiple onChange={importMatchFiles} className="hidden" />
              </label>
              <button onClick={() => setShowTextImport(true)} className="btn w-full sm:w-auto justify-center">
                <ClipboardTextIcon weight="bold" size={20} />
                Paste Match Codes
              </button>
            </div>
          </div>

          {uploadedMatches.length > 0 && (
            <div className="space-y-2">
              {uploadedMatches.map((match, index) => {
                const cycleEvents = match.events.filter(e => e.type === 'cycle')
                const scored = cycleEvents.reduce((s, e) => s + e.scored, 0)
                const total = cycleEvents.reduce((s, e) => s + e.total, 0)

                return (
                  <div key={index} className="border-2 border-brand-border p-3 flex justify-between items-center">
                    <span>
                      Match {index + 1} ({match.teamNumber || 'No Team'}) — {scored}/{total}
                    </span>
                    <button onClick={() => removeMatch(index)} className="error-btn px-3 py-1 text-sm">
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button
          onClick={createTournament}
          className="btn bg-brand-accent text-brand-mainText px-6 w-full sm:w-auto justify-center"
        >
          <FloppyDisk weight="bold" size={20} />
          Create Tournament
        </button>
      </div>
    </div>
  )
}

export default TournamentCreator
