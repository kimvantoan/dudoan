export function formatMatchTime(startTimeStr: string): string {
  try {
    const dateObj = new Date(startTimeStr);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      day: '2-digit',
      month: '2-digit',
    });
    
    const parts = formatter.formatToParts(dateObj);
    const partMap = new Map(parts.map(p => [p.type, p.value]));
    
    const hour = partMap.get('hour') || '';
    const minute = partMap.get('minute') || '';
    const day = partMap.get('day') || '';
    const month = partMap.get('month') || '';
    
    const timeStr = minute === '00' ? `${parseInt(hour, 10)}h` : `${parseInt(hour, 10)}h${minute}`;
    return `${timeStr} - ${day}/${month}`;
  } catch (e) {
    return '';
  }
}

export function formatMatchStage(groupName: string | null, stage: string | null): string {
  const stageTranslations: { [key: string]: string } = {
    'GROUP_STAGE': 'Vòng bảng',
    'LAST_16': 'Vòng 1/8',
    'QUARTER_FINALS': 'Tứ kết',
    'SEMI_FINALS': 'Bán kết',
    'THIRD_PLACE': 'Tranh hạng ba',
    'FINAL': 'Chung kết',
  };

  const friendlyStage = stage ? (stageTranslations[stage] || stage) : '';
  
  if (groupName) {
    const groupLetter = groupName.replace('GROUP_', '');
    return `${friendlyStage} • Bảng ${groupLetter}`;
  }
  
  return friendlyStage;
}
