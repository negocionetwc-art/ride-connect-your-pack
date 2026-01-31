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
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <!-- Anel verde suave indicando online -->
      <div style="
        position: absolute;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: 3px solid rgba(34, 197, 94, 0.4);
        box-shadow: 
          0 0 0 2px rgba(34, 197, 94, 0.2),
          0 0 20px rgba(34, 197, 94, 0.3);
        animation: pulse-ring 2s ease-in-out infinite;
      "></div>
      
      <!-- Foto do usuário -->
      <div style="
        position: relative;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid rgba(34, 197, 94, 0.6);
        box-shadow: 
          0 2px 8px rgba(0, 0, 0, 0.2),
          inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        z-index: 1;
      ">
        <img 
          src="${avatarUrl}" 
          alt="Rider"
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          "
          onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'; this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:bold\\'>🏍️</div>'"
        />
      </div>
      
      ${speed !== undefined ? `
        <div style="
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.2);
          z-index: 2;
        ">${Math.round(speed)} km/h</div>
      ` : ''}
    </div>
    <style>
      @keyframes pulse-ring {
        0%, 100% {
          transform: scale(1);
          opacity: 0.6;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.3;
        }
      }
    </style>
  `;

  return new DivIcon({
    html,
    className: 'custom-rider-marker',
    iconSize: [56, speed !== undefined ? 68 : 56],
    iconAnchor: [28, speed !== undefined ? 68 : 56],
    popupAnchor: [0, speed !== undefined ? -68 : -56],
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
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <!-- Anel verde suave duplo para destaque -->
      <div style="
        position: absolute;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: 3px solid rgba(34, 197, 94, 0.5);
        box-shadow: 
          0 0 0 3px rgba(34, 197, 94, 0.3),
          0 0 0 6px rgba(34, 197, 94, 0.15),
          0 0 25px rgba(34, 197, 94, 0.4);
        animation: pulse-own-ring 2s ease-in-out infinite;
      "></div>
      
      <!-- Foto do usuário -->
      <div style="
        position: relative;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid rgba(34, 197, 94, 0.8);
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.3),
          inset 0 0 0 1px rgba(255, 255, 255, 0.2),
          0 0 20px rgba(34, 197, 94, 0.5);
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        z-index: 1;
      ">
        ${avatarUrl ? `
          <img 
            src="${avatarUrl}" 
            alt="Você"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            "
            onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'; this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:bold\\'>🏍️</div>'"
          />
        ` : `
          <div style="
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
          ">🏍️</div>
        `}
      </div>
      
      ${speed !== undefined ? `
        <div style="
          position: absolute;
          bottom: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          padding: 4px 10px;
          border-radius: 14px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 
            0 3px 10px rgba(34, 197, 94, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          z-index: 2;
        ">${Math.round(speed)} km/h</div>
      ` : ''}
    </div>
    <style>
      @keyframes pulse-own-ring {
        0%, 100% {
          transform: scale(1);
          opacity: 0.7;
        }
        50% {
          transform: scale(1.15);
          opacity: 0.4;
        }
      }
    </style>
  `;

  return new DivIcon({
    html,
    className: 'custom-own-location-marker',
    iconSize: [64, speed !== undefined ? 78 : 64],
    iconAnchor: [32, speed !== undefined ? 78 : 64],
    popupAnchor: [0, speed !== undefined ? -78 : -64],
  });
};
