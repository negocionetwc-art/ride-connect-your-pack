import { DivIcon } from 'leaflet';

// Marcador customizado para grupos
export const createGroupMarkerIcon = (color: string = '#ff6b00') => {
  const html = `
    <div style="
      width: 40px;
      height: 40px;
      background: ${color};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
        font-size: 20px;
        font-weight: bold;
      ">👥</div>
    </div>
  `;

  return new DivIcon({
    html,
    className: 'custom-group-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Marcador customizado para riders com avatar
export const createRiderMarkerIcon = (avatarUrl: string, speed?: number) => {
  const html = `
    <div style="
      position: relative;
      width: 48px;
      height: 48px;
    ">
      <div style="
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 3px solid #ff6b00;
        overflow: hidden;
        box-shadow: 0 0 15px rgba(255, 107, 0, 0.5);
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <img 
          src="${avatarUrl}" 
          alt="Rider"
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          "
          onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Ccircle cx=%2224%22 cy=%2224%22 r=%2224%22 fill=%22%23ff6b00%22/%3E%3C/svg%3E'"
        />
      </div>
      ${speed !== undefined ? `
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          background: #ff6b00;
          color: white;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">${speed} km/h</div>
      ` : ''}
      <div style="
        position: absolute;
        top: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 16px;
        height: 16px;
        background: #22c55e;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
        animation: pulse 2s infinite;
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% {
          transform: translateX(-50%) scale(1);
          opacity: 1;
        }
        50% {
          transform: translateX(-50%) scale(1.2);
          opacity: 0.7;
        }
      }
    </style>
  `;

  return new DivIcon({
    html,
    className: 'custom-rider-marker',
    iconSize: [48, speed !== undefined ? 60 : 48],
    iconAnchor: [24, speed !== undefined ? 60 : 48],
    popupAnchor: [0, speed !== undefined ? -60 : -48],
  });
};

// Marcador customizado para localização atual do usuário
export const createCurrentLocationIcon = () => {
  const html = `
    <div style="
      position: relative;
      width: 24px;
      height: 24px;
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
        background: #ff6b00;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 15px rgba(255, 107, 0, 0.6);
        animation: pulse-location 2s infinite;
      "></div>
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        z-index: 1;
      "></div>
    </div>
    <style>
      @keyframes pulse-location {
        0%, 100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.5);
          opacity: 0.5;
        }
      }
    </style>
  `;

  return new DivIcon({
    html,
    className: 'custom-current-location-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Marcador customizado para o próprio usuário compartilhando localização
export const createOwnLocationMarkerIcon = (avatarUrl?: string, speed?: number) => {
  const html = `
    <div style="
      position: relative;
      width: 56px;
      height: 56px;
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: 4px solid #22c55e;
        overflow: hidden;
        box-shadow: 0 0 20px rgba(34, 197, 94, 0.7);
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse-own 2s infinite;
      ">
        ${avatarUrl ? `
          <img 
            src="${avatarUrl}" 
            alt="Você"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
            "
            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22%3E%3Ccircle cx=%2228%22 cy=%2228%22 r=%2228%22 fill=%22%2322c55e%22/%3E%3C/svg%3E'"
          />
        ` : `
          <div style="
            width: 100%;
            height: 100%;
            background: #22c55e;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
          ">Você</div>
        `}
      </div>
      ${speed !== undefined ? `
        <div style="
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: #22c55e;
          color: white;
          padding: 3px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">${Math.round(speed)} km/h</div>
      ` : ''}
      <div style="
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 20px;
        background: #22c55e;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
      ">✓</div>
    </div>
    <style>
      @keyframes pulse-own {
        0%, 100% {
          transform: translate(-50%, -50%) scale(1);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.7);
        }
        50% {
          transform: translate(-50%, -50%) scale(1.05);
          box-shadow: 0 0 30px rgba(34, 197, 94, 0.9);
        }
      }
    </style>
  `;

  return new DivIcon({
    html,
    className: 'custom-own-location-marker',
    iconSize: [56, speed !== undefined ? 70 : 56],
    iconAnchor: [28, speed !== undefined ? 70 : 56],
    popupAnchor: [0, speed !== undefined ? -70 : -56],
  });
};
