export async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather fetch failed');
  const data = await res.json();
  return {
    temp: Math.round(data.current.temperature_2m),
    code: data.current.weather_code,
  };
}

export function weatherEmoji(code) {
  if (code === 0) return '☀️';
  if ([1, 2, 3].includes(code)) return '⛅';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌡️';
}

export function weatherLabel(code) {
  if (code === 0) return '맑음';
  if ([1, 2, 3].includes(code)) return '구름 조금';
  if ([45, 48].includes(code)) return '안개';
  if ([51, 53, 55, 56, 57].includes(code)) return '이슬비';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '비';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '눈';
  if ([95, 96, 99].includes(code)) return '뇌우';
  return '';
}
