import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { RobotModelType } from '../types/robot';
import { initCustomBlockly } from './generators/liveGenerator';
import { bleService } from '../ble/BLEManager';
import { BLEProtocol } from '../ble/Protocol';
import { SoundFXManager } from '../ble/SoundFX';
import { Play, RotateCcw, Sparkles, Save, DownloadCloud, Check, Maximize2, Minimize2 } from 'lucide-react';

interface Props {
  model: RobotModelType;
  onCodeRun?: () => void;
}

export const BlocklyWorkspace: React.FC<Props> = ({ model, onCodeRun }) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [savedNotify, setSavedNotify] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Field editor popups (colour picker, dropdowns, text inputs) are mounted
  // on <body> and can pile up as leftover columns over the block area if they
  // aren't closed when the workspace changes, resizes, or disposes.
  const closeOpenPopups = () => {
    try {
      Blockly.WidgetDiv.hide();
      Blockly.DropDownDiv.hideWithoutAnimation();
    } catch (e) {
      // no-op if not yet injected
    }
  };

  useEffect(() => {
    initCustomBlockly();

    if (blocklyDiv.current && !workspaceRef.current) {
      const toolboxConfig = getToolboxForModel(model);

      const ws = Blockly.inject(blocklyDiv.current, {
        toolbox: toolboxConfig,
        trashcan: true,
        scrollbars: false,
        sounds: true,
        rtl: true, // Arabic support
        renderer: 'geras',
        move: {
          scrollbars: false,
          drag: true,
          wheel: false,
        },
        grid: {
          spacing: 25,
          length: 3,
          colour: '#334155',
          snap: true,
        },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 0.8,
          maxScale: 2.0,
          minScale: 0.4,
          scaleSpeed: 1.1,
        },
        theme: Blockly.Theme.defineTheme('modernDark', {
          name: 'modernDark',
          base: Blockly.Themes.Classic,
          componentStyles: {
            workspaceBackgroundColour: '#0b1120',
            toolboxBackgroundColour: '#1e293b',
            toolboxForegroundColour: '#f8fafc',
            flyoutBackgroundColour: '#0f172a',
            flyoutForegroundColour: '#f8fafc',
            scrollbarColour: '#475569',
            insertionMarkerColour: '#38bdf8',
            insertionMarkerOpacity: 0.8,
          },
        }),
      });

      workspaceRef.current = ws;

      // Close the category flyout right after a block is clicked/dragged out
      // so it doesn't linger as a vertical column over the blocks area.
      try {
        const fl = ws.getFlyout() as Blockly.Flyout | null;
        fl?.setAutoClose(true);
      } catch (e) {
        // no-op if flyout unavailable (e.g. simple toolbox)
      }

      // Check LocalStorage for saved workspace
      const savedKey = `mini_g_workspace_${model}`;
      const cachedXml = localStorage.getItem(savedKey);
      if (cachedXml) {
        try {
          const dom = Blockly.utils.xml.textToDom(cachedXml);
          Blockly.Xml.domToWorkspace(dom, ws);
        } catch (e) {
          loadDefault(ws);
        }
      } else {
        loadDefault(ws);
      }

      // Automatically trigger SVG resize
      setTimeout(() => {
        Blockly.svgResize(ws);
      }, 100);
    }

    function loadDefault(ws: Blockly.WorkspaceSvg) {
      const starterXml = getStarterXml(model);
      const dom = Blockly.utils.xml.textToDom(starterXml);
      Blockly.Xml.domToWorkspace(dom, ws);
    }

    // Window resize observer
    const handleResize = () => {
      if (workspaceRef.current) {
        Blockly.svgResize(workspaceRef.current);
      }
      closeOpenPopups();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      closeOpenPopups();
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, [model]);

  // Handle expansion / resize updates
  useEffect(() => {
    closeOpenPopups();
    if (workspaceRef.current) {
      setTimeout(() => {
        Blockly.svgResize(workspaceRef.current!);
      }, 150);
    }
  }, [isExpanded]);

  useEffect(() => {
    (window as any).__BLE_DISPATCH__ = async (cmd: number, param: any) => {
      let dataBytes: number[] = [];
      if (typeof param === 'string' && param.startsWith('#')) {
        dataBytes = BLEProtocol.hexToRgb(param);
      } else if (Array.isArray(param)) {
        dataBytes = param;
      } else if (typeof param === 'number') {
        dataBytes = [param];
      }
      await bleService.sendCommand(cmd, dataBytes);
    };
  }, []);

  const handleRunCode = async () => {
    if (!workspaceRef.current) return;
    closeOpenPopups();
    SoundFXManager.playRobotChirp();
    const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
    if (onCodeRun) onCodeRun();

    try {
      const asyncFn = new Function(`return (async () => { 
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        ${code}
      })()`);
      await asyncFn();
    } catch (e) {
      console.error('Execution error:', e);
    }
  };

  const handleSaveProject = () => {
    if (!workspaceRef.current) return;
    closeOpenPopups();
    SoundFXManager.playClickBeep();
    const xmlDom = Blockly.Xml.workspaceToDom(workspaceRef.current);
    const xmlText = Blockly.Xml.domToText(xmlDom);
    localStorage.setItem(`mini_g_workspace_${model}`, xmlText);
    setSavedNotify(true);
    setTimeout(() => setSavedNotify(false), 2000);
  };

  const handleExportXML = () => {
    if (!workspaceRef.current) return;
    const xmlDom = Blockly.Xml.workspaceToDom(workspaceRef.current);
    const xmlText = Blockly.Xml.domToText(xmlDom);
    const blob = new Blob([xmlText], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_${model}_program.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetWorkspace = () => {
    if (!workspaceRef.current) return;
    closeOpenPopups();
    SoundFXManager.playClickBeep();
    workspaceRef.current.clear();
    const dom = Blockly.utils.xml.textToDom(getStarterXml(model));
    Blockly.Xml.domToWorkspace(dom, workspaceRef.current);
  };

  return (
    <div className={`relative z-10 isolate w-full max-w-full min-w-0 flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl transition-all duration-300 ${
      isExpanded ? 'h-[750px]' : 'h-[480px]'
    }`}>
      {/* Workspace Action Bar */}
      <div className="h-14 bg-slate-800/95 backdrop-blur px-3 md:px-4 flex items-center justify-between border-b border-slate-700 flex-wrap gap-2 flex-shrink-0 z-30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-kid-yellow animate-pulse" />
          <span className="font-bold text-slate-200 text-xs md:text-sm">استوديو البرمجة التفاعلي</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Toggle Expand Height */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
            title={isExpanded ? 'تصغير المساحة' : 'تكبير مساحة البرمجة'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveProject}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
              savedNotify ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
            title="حفظ المشروع بالجهاز"
          >
            {savedNotify ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{savedNotify ? 'تم الحفظ!' : 'حفظ'}</span>
          </button>

          {/* Export File */}
          <button
            onClick={handleExportXML}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition active:scale-95"
            title="تنزيل ملف المشروع XML"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تصدير XML</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleResetWorkspace}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold transition active:scale-95"
            title="إعادة تعيين مساحة العمل"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">إعادة</span>
          </button>

          {/* Play Live */}
          <button
            onClick={handleRunCode}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-kid-glow to-kid-primary hover:brightness-110 text-white font-bold text-xs md:text-sm shadow-lg shadow-kid-glow/30 transition transform active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>تشغيل الكود 🚀</span>
          </button>
        </div>
      </div>

      {/* Blockly Canvas Container - Explicit Flex-1 with min-height */}
      <div className="relative w-full max-w-full min-w-0 flex-1 min-h-[380px] bg-slate-950 overflow-hidden isolate">
        <div ref={blocklyDiv} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
};

function getToolboxForModel(model: RobotModelType) {
  let modelBlocks = '';
  if (model === 'mini_gf') {
    modelBlocks = `
      <category name="🎨 الألوان والضوء" colour="#F97316">
        <block type="gf_set_color"></block>
      </category>
      <category name="📳 الهزاز والمشاعر" colour="#EC4899">
        <block type="gf_vibrate"></block>
      </category>
      <category name="👆 أحداث اللمس" colour="#10B981">
        <block type="gf_on_touch"></block>
      </category>
    `;
  } else if (model === 'mini_gm') {
    modelBlocks = `
      <category name="👀 عيون الشاشة" colour="#06B6D4">
        <block type="gm_set_expression"></block>
        <block type="gm_set_custom_face"></block>
      </category>
      <category name="🤖 حركة الرأس" colour="#8B5CF6">
        <block type="gm_rotate_head"></block>
      </category>
      <category name="🎵 الأصوات والنغمات" colour="#F59E0B">
        <block type="gm_play_sound"></block>
      </category>
    `;
  } else {
    modelBlocks = `
      <category name="🚗 قيادة العجلات" colour="#3B82F6">
        <block type="g_drive"></block>
      </category>
      <category name="🦾 مفاصل الأذرع" colour="#8B5CF6">
        <block type="g_move_arms"></block>
      </category>
      <category name="🎭 شخصيات الذكاء الاصطناعي" colour="#EC4899">
        <block type="g_set_ai_persona"></block>
        <block type="g_ai_speak"></block>
      </category>
    `;
  }

  return `
    <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
      ${modelBlocks}
      <sep></sep>
      <category name="🔁 التكرار والتحكم" colour="#6366F1">
        <block type="controls_repeat_ext">
          <value name="TIMES">
            <shadow type="math_number">
              <field name="NUM">3</field>
            </shadow>
          </value>
        </block>
      </category>
    </xml>
  `;
}

function getStarterXml(model: RobotModelType) {
  if (model === 'mini_gf') {
    return `<xml><block type="gf_set_color" x="40" y="40"><field name="COLOR">#22c55e</field><next><block type="gf_vibrate"><field name="DURATION">500</field></block></next></block></xml>`;
  } else if (model === 'mini_gm') {
    return `<xml><block type="gm_set_expression" x="40" y="40"><field name="EXPRESSION">0</field><next><block type="gm_rotate_head"><field name="ANGLE">20</field><next><block type="gm_play_sound"><field name="SOUND_PARAMS">523,3</field></block></next></block></next></block></xml>`;
  } else {
    return `<xml><block type="g_set_ai_persona" x="40" y="40"><field name="PERSONA">0</field><next><block type="g_move_arms"><field name="ARM_ACTION">both,90</field><next><block type="g_ai_speak"><field name="SPEECH_TEXT">أهلاً بكم يا أبطال البرمجة!</field></block></next></block></next></block></xml>`;
  }
}
