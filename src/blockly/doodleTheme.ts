import * as Blockly from 'blockly';

/**
 * Doodle Paper theme for Blockly — warm paper background, crayon-colored blocks,
 * ink-dark text. Used when html[data-mode="doodle"] is active.
 */
export const doodlePaperTheme = Blockly.Theme.defineTheme('doodlePaper', {
  name: 'doodlePaper',
  base: Blockly.Themes.Classic,
  blockStyles: {
    // Movement / actions — crayon red
    action_blocks: {
      colourPrimary: '#ff6b6b',
      colourSecondary: '#ffd6d6',
      colourTertiary: '#cc5555',
      hat: '',
    },
    // Color / light — crayon yellow
    colour_blocks: {
      colourPrimary: '#ffd93d',
      colourSecondary: '#fff4cc',
      colourTertiary: '#ccae30',
      hat: '',
    },
    // Vibration / feel — crayon green
    vibration_blocks: {
      colourPrimary: '#6bcb77',
      colourSecondary: '#d4f7d9',
      colourTertiary: '#55a25f',
      hat: '',
    },
    // Time / wait — crayon blue
    time_blocks: {
      colourPrimary: '#4d96ff',
      colourSecondary: '#d6e4ff',
      colourTertiary: '#3d78cc',
      hat: '',
    },
    // Events / touch — crayon pink
    event_blocks: {
      colourPrimary: '#ff6b9d',
      colourSecondary: '#ffd6e8',
      colourTertiary: '#cc557d',
      hat: '',
    },
    // Loop / control — crayon purple
    loop_blocks: {
      colourPrimary: '#a78bfa',
      colourSecondary: '#e0d4ff',
      colourTertiary: '#8570cc',
      hat: '',
    },
    // Screen / face — cyan
    screen_blocks: {
      colourPrimary: '#22d3ee',
      colourSecondary: '#ccf5fa',
      colourTertiary: '#1aa8be',
      hat: '',
    },
    // Head movement — violet
    head_blocks: {
      colourPrimary: '#a78bfa',
      colourSecondary: '#e0d4ff',
      colourTertiary: '#8570cc',
      hat: '',
    },
    // Sound — amber
    sound_blocks: {
      colourPrimary: '#f59e0b',
      colourSecondary: '#fef3c7',
      colourTertiary: '#c47e09',
      hat: '',
    },
    // Drive / wheels — sky blue
    drive_blocks: {
      colourPrimary: '#60a5fa',
      colourSecondary: '#dbeafe',
      colourTertiary: '#4c84c7',
      hat: '',
    },
    // Arm / joint — violet
    arm_blocks: {
      colourPrimary: '#a78bfa',
      colourSecondary: '#e0d4ff',
      colourTertiary: '#8570cc',
      hat: '',
    },
    // AI — pink
    ai_blocks: {
      colourPrimary: '#ec4899',
      colourSecondary: '#fce7f3',
      colourTertiary: '#be397a',
      hat: '',
    },
    // Default fallback
    default: {
      colourPrimary: '#ff9f43',
      colourSecondary: '#ffe0cc',
      colourTertiary: '#cc7f35',
      hat: '',
    },
  },
  categoryStyles: {
    action_category: { colour: '#ff6b6b' },
    colour_category: { colour: '#ffd93d' },
    vibration_category: { colour: '#6bcb77' },
    time_category: { colour: '#4d96ff' },
    event_category: { colour: '#ff6b9d' },
    loop_category: { colour: '#a78bfa' },
    screen_category: { colour: '#22d3ee' },
    head_category: { colour: '#a78bfa' },
    sound_category: { colour: '#f59e0b' },
    drive_category: { colour: '#60a5fa' },
    arm_category: { colour: '#a78bfa' },
    ai_category: { colour: '#ec4899' },
  },
  componentStyles: {
    workspaceBackgroundColour: '#fdfbf4',
    toolboxBackgroundColour: '#f5f0e1',
    toolboxForegroundColour: '#2b2a33',
    flyoutBackgroundColour: '#f5f0e1',
    flyoutForegroundColour: '#2b2a33',
    flyoutOpacity: 0.97,
    scrollbarColour: '#d4cfc2',
    insertionMarkerColour: '#ff6b6b',
    insertionMarkerOpacity: 0.55,
    cursorColour: '#ff6b6b',
  },
  fontStyle: {
    family: "'Cairo Play', 'Cairo', cursive, sans-serif",
    weight: 'bold',
    size: 13,
  },
});
