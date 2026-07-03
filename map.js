import data from "./data.js"

const icons = {
  small: L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [18, 30],
    iconAnchor: [9, 30],
  }),

  medium: L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),

  large: L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [35, 57],
    iconAnchor: [17, 57],
  }),
}

const map = L.map("map").setView([42.21712327446316, 43.15429371494776], 8)

const contextMenu = document.createElement("div")
contextMenu.className = "map-context-menu"
contextMenu.style.display = "none"
contextMenu.innerHTML = `
  <button id="copyCoordsBtn" type="button">Copy coordinates</button>
  <button id="shareLocationBtn" type="button">Share location</button>
  <button id="openGoogleMapsBtn" type="button">Open in Google Maps</button>
`
document.body.appendChild(contextMenu)

let contextLatLng = null

const buildShareUrl = (lat, lng, zoom) => {
  const url = new URL(window.location.href)
  url.searchParams.set("lat", lat.toFixed(8))
  url.searchParams.set("lng", lng.toFixed(8))
  url.searchParams.set("zoom", zoom.toFixed(0))
  return url.toString()
}

const applySharedLocation = () => {
  const params = new URLSearchParams(window.location.search)
  const lat = Number.parseFloat(params.get("lat"))
  const lng = Number.parseFloat(params.get("lng"))
  const zoom = Number.parseFloat(params.get("zoom"))

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const targetZoom = Number.isFinite(zoom) ? zoom : 14
    map.flyTo([lat, lng], targetZoom)
    coordsInput.value = `${lat.toFixed(6)} ${lng.toFixed(6)}`
  }
}

const showContextMenu = (event) => {
  if (typeof event.preventDefault === "function") {
    event.preventDefault()
  }
  contextLatLng = event.latlng
  contextMenu.style.display = "block"
  contextMenu.style.left = `${event.originalEvent.clientX}px`
  contextMenu.style.top = `${event.originalEvent.clientY}px`
}

const hideContextMenu = () => {
  contextMenu.style.display = "none"
}

map.on("contextmenu", showContextMenu)
document.addEventListener("mousedown", (event) => {
  if (event.button === 0 && !contextMenu.contains(event.target)) {
    hideContextMenu()
  }
})

contextMenu.addEventListener("click", (event) => {
  if (!contextLatLng) return

  if (event.target.id === "copyCoordsBtn") {
    const text = `${contextLatLng.lat.toFixed(10)} ${contextLatLng.lng.toFixed(10)}`
    navigator.clipboard.writeText(text).catch(() => {})
    hideContextMenu()
  }

  if (event.target.id === "shareLocationBtn") {
    const shareUrl = buildShareUrl(contextLatLng.lat, contextLatLng.lng, map.getZoom())
    window.history.replaceState({}, "", shareUrl)
    navigator.clipboard.writeText(shareUrl).catch(() => {
      window.prompt("Copy this URL:", shareUrl)
    })
    hideContextMenu()
  }

  if (event.target.id === "openGoogleMapsBtn") {
    const url = `https://www.google.com/maps?q=${contextLatLng.lat},${contextLatLng.lng}`
    window.open(url, "_blank", "noopener,noreferrer")
    hideContextMenu()
  }
})

const coordsInput = document.getElementById("coordsInput")
const jumpBtn = document.getElementById("jumpBtn")
const currentYear = document.getElementById("currentYear")

if (currentYear) {
  currentYear.textContent = new Date().getFullYear()
}

const goToCoordinates = () => {
  const value = coordsInput.value.trim()
  const parts = value.split(/\s+/)

  if (parts.length < 2) return

  const lat = Number.parseFloat(parts[0])
  const lng = Number.parseFloat(parts[1])

  if (Number.isNaN(lat) || Number.isNaN(lng)) return

  map.flyTo([lat, lng], 14)
}

jumpBtn.addEventListener("click", goToCoordinates)
applySharedLocation()
coordsInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault()
    goToCoordinates()
  }
})

const tryAutoJump = () => {
  const value = coordsInput.value.trim()
  const parts = value.split(/\s+/)

  if (parts.length < 2) return

  const lat = Number.parseFloat(parts[0])
  const lng = Number.parseFloat(parts[1])

  if (Number.isNaN(lat) || Number.isNaN(lng)) return

  goToCoordinates()
}

coordsInput.addEventListener("paste", tryAutoJump)
coordsInput.addEventListener("input", tryAutoJump)

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
    event.preventDefault()
    event.stopPropagation()
    coordsInput.focus()
    coordsInput.select()
    setTimeout(() => coordsInput.focus(), 0)
  }
})

const satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "&copy; Esri",
  },
)

const labels = L.tileLayer(
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "&copy; Esri",
  },
)

satellite.addTo(map)
labels.addTo(map)

data.forEach((c) => {
  L.marker([c.lat, c.lng], {
    icon: icons[c.size ?? "medium"],
  }).addTo(map).bindPopup(`
    <div>
        ${c.lat} ${c.lng}
        <div>
            <a href="https://www.google.com/maps?q=${c.lat},${c.lng}" target="_blank">
                Open in Google Maps
            </a>
        </div>
      </div>
    `)
})
