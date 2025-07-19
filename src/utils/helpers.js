export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatDateCompact = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month.substring(0, 3)} ${day}`;
};

export const getCurrentWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    weekDates.push(date);
  }
  
  return weekDates;
};

export const getDensityClasses = (density, type) => {
  const classes = {
    padding: {
      comfortable: 'p-6',
      compact: 'p-4',
      'ultra-compact': 'p-2'
    },
    paddingSmall: {
      comfortable: 'p-4',
      compact: 'p-3',
      'ultra-compact': 'p-1.5'
    },
    gap: {
      comfortable: 'gap-3',
      compact: 'gap-2',
      'ultra-compact': 'gap-1'
    },
    text: {
      comfortable: 'text-base',
      compact: 'text-sm',
      'ultra-compact': 'text-xs'
    },
    heading: {
      comfortable: 'text-3xl',
      compact: 'text-2xl',
      'ultra-compact': 'text-xl'
    },
    button: {
      comfortable: 'px-4 py-2',
      compact: 'px-3 py-1.5',
      'ultra-compact': 'px-2 py-1'
    },
    buttonSmall: {
      comfortable: 'px-3 py-1.5',
      compact: 'px-2 py-1',
      'ultra-compact': 'px-1.5 py-0.5'
    },
    iconSize: {
      comfortable: 20,
      compact: 16,
      'ultra-compact': 14
    },
    iconSizeSmall: {
      comfortable: 18,
      compact: 14,
      'ultra-compact': 12
    },
    rounded: {
      comfortable: 'rounded-lg',
      compact: 'rounded-md',
      'ultra-compact': 'rounded'
    },
    space: {
      comfortable: 'space-y-2',
      compact: 'space-y-1.5',
      'ultra-compact': 'space-y-1'
    },
    margin: {
      comfortable: 'mb-6',
      compact: 'mb-4',
      'ultra-compact': 'mb-2'
    },
    marginSmall: {
      comfortable: 'mb-4',
      compact: 'mb-3',
      'ultra-compact': 'mb-1.5'
    }
  };

  return classes[type]?.[density] || classes[type]?.compact;
};

export const getGridClasses = (displayMode) => {
  switch (displayMode) {
    case '1':
      return 'grid-cols-1';
    case '2':
      return 'grid-cols-1 sm:grid-cols-2';
    case '3':
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    case 'auto':
    default:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  }
};