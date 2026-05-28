export function formatMatchTime(startTimeStr: string): string {
  try {
    const dateObj = new Date(startTimeStr);
    const formattedDate = dateObj.toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedTime = dateObj.toLocaleTimeString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${formattedTime} - ${formattedDate}`;
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
