import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { RobotModelType } from '../types/robot';
import { initCustomBlockly } from './generators/liveGenerator';
import { bleService } from '../ble/BLEManager';
import { BLEProtocol } from '../ble/Protocol';
import { SoundFXManager } from '../ble/SoundFX';
import { doodlePaperTheme } from './doodleTheme';
import { emitWaraki } from '../services/warakiBus';
import { Play, RotateCcw, Sparkles, Save, DownloadCloud, Check, Maximize2, Minimize2 } from 'lucide-react';

interface Props {
  model: RobotModelType;
  doodle?: boolean;
  onCodeRun?: () => void;
}

export const BlocklyWorkspace: React.FC<Props> = ({ model, doodle = false, onCodeRun }) => {
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
          startScale: doodle ? 0.95 : 0.8,
          maxScale: 2.0,
          minScale: 0.4,
          scaleSpeed: 1.1,
        },
        theme: doodle ? doodlePaperTheme : Blockly.Theme.defineTheme('modernDark', {
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

    // Waraki: react to block drag starts (doodle notebook eye-tracking)
    const dragListener = (e: Blockly.Events.Abstract) => {
      if (!doodleRef.current) return;
      if (e.type === Blockly.Events.BLOCK_DRAG && (e as Blockly.Events.BlockDrag).isStart) {
        emitWaraki({ type: 'drag' });
      }
    };
    if (workspaceRef.current) {
      workspaceRef.current.addChangeListener(dragListener);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (workspaceRef.current) {
        workspaceRef.current.removeChangeListener(dragListener);
      }
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
    const ws = workspaceRef.current;
    if (!ws) return;
    // Guard: cancel if unmounted, and only resize if the same (still-alive) workspace
    const timer = window.setTimeout(() => {
      if (workspaceRef.current === ws) {
        Blockly.svgResize(ws);
      }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [isExpanded]);

  useEffect(() => {
    (window as any).__BLE_DISPATCH__ = async (cmd: number, param: any, blockId?: string) => {
      let dataBytes: number[] = [];
      if (typeof param === 'string' && param.startsWith('#')) {
        dataBytes = BLEProtocol.hexToRgb(param);
      } else if (Array.isArray(param)) {
        dataBytes = param;
      } else if (typeof param === 'number') {
        dataBytes = [param];
      }
      if (doodleRef.current) {
        await highlightBlockStep(blockId, doodleSpeedRef.current);
        // Feed Waraki: lamp on for any dispatch + colour/vibrate reactions
        if (cmd === 0x10 && typeof param === 'string' && param.startsWith('#')) {
          emitWaraki({ type: 'color', color: param });
        } else if (cmd === 0x11) {
          emitWaraki({ type: 'vibrate' });
        } else {
          emitWaraki({ type: 'run-start' });
        }
      }
      await bleService.sendCommand(cmd, dataBytes);
      if (doodleRef.current) unhighlightBlock(blockId);
    };
  }, []);

  // Doodle step-runner: pace + highlight refs (kept fresh via effects below).
  const doodleSpeedRef = useRef<number>(700);
  const doodleRef = useRef<boolean>(doodle);
  useEffect(() => {
    doodleRef.current = doodle;
  }, [doodle]);

  const highlightBlock = (blockId: string | undefined) => {
    if (!blockId || !workspaceRef.current) return;
    const block = workspaceRef.current.getBlockById(blockId);
    if (block) block.addClass('blockly-executing');
  };

  const unhighlightBlock = (blockId: string | undefined) => {
    if (!blockId || !workspaceRef.current) return;
    const block = workspaceRef.current.getBlockById(blockId);
    if (block) block.removeClass('blockly-executing');
  };

  const highlightBlockStep = async (blockId: string | undefined, holdMs: number) => {
    if (!blockId) return;
    highlightBlock(blockId);
    await new Promise((r) => setTimeout(r, holdMs));
  };

  // Step-pacing hook the generated code awaits between steps (doodle mode only).
  useEffect(() => {
    (window as any).__BLE_STEP_WAIT__ = async (ms: number, blockId?: string) => {
      const speed = doodleRef.current ? doodleSpeedRef.current : 0;
      if (doodleRef.current) {
        await highlightWait(blockId, Math.min(ms, speed));
      } else {
        await new Promise((r) => setTimeout(r, ms));
      }
    };
  }, []);

  const highlightWait = async (blockId: string | undefined, holdMs: number) => {
    if (!blockId) {
      await new Promise((r) => setTimeout(r, holdMs));
      return;
    }
    highlightBlock(blockId);
    await new Promise((r) => setTimeout(r, holdMs));
    unhighlightBlock(blockId);
    await new Promise((r) => setTimeout(r, holdMs * 0.25));
  };

  const handleRunCode = async () => {
    if (!workspaceRef.current) return;
    closeOpenPopups();
    SoundFXManager.playRobotChirp();
    if (doodle) SoundFXManager.playPaperRustle();
    const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
    // Expose the student's actual generated program for the AI Code Reviewer
    (window as any).__LAST_STUDENT_CODE__ = code;
    if (onCodeRun) onCodeRun();

    try {
      const asyncFn = new Function(`return (async () => { 
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        ${code}
      })()`);
      await asyncFn();
      if (doodle) emitWaraki({ type: 'success' });
    } catch (e) {
      console.error('Execution error:', e);
      if (doodle) emitWaraki({ type: 'error' });
    } finally {
      // Safety: clear any leftover highlight if execution threw mid-way
      if (workspaceRef.current) {
        for (const b of workspaceRef.current.getAllBlocks(false)) {
          b.removeClass('blockly-executing');
        }
      }
    }
  };

  const [speed, setSpeed] = useState<'slow' | 'normal'>('slow');

  // Keep the speed ref in sync so the execution bridge always sees the latest value.
  useEffect(() => {
    doodleSpeedRef.current = speed === 'slow' ? 700 : 150;
  }, [speed]);

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
    <div className={`relative z-10 isolate w-full max-w-full min-w-0 flex flex-col rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 ${
        doodle
          ? 'bg-[#fdfbf4] border-[#2b2a33]/40'
          : 'bg-slate-900 border-slate-700'
      } ${isExpanded ? 'h-[750px]' : 'h-[480px]'}`}>
      {/* Workspace Action Bar */}
      <div className={`h-14 px-3 md:px-4 flex items-center justify-between border-b flex-wrap gap-2 flex-shrink-0 z-30 ${
          doodle
            ? 'bg-[#f5f0e1]/95 border-[#2b2a33]/20'
            : 'bg-slate-800/95 border-slate-700'
        }`}>
        <div className="flex items-center gap-2">
          <Sparkles className={`w-5 h-5 animate-pulse ${doodle ? 'text-[#ff6b6b]' : 'text-kid-yellow'}`} />
          <span className={`font-bold text-xs md:text-sm ${doodle ? 'text-[#2b2a33] doodle-title' : 'text-slate-200'}`}>
            {doodle ? 'لوحة السحر الورقية 🪄' : 'استوديو البرمجة التفاعلي'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Doodle speed toggle: 🐢 slow (700ms/step) / 🐇 normal (150ms/step) */}
          {doodle && (
            <div className="flex items-center rounded-xl border-2 border-[#2b2a33]/40 overflow-hidden text-xs font-bold">
              <button
                onClick={() => setSpeed('slow')}
                className={`px-2 py-1.5 transition ${speed === 'slow' ? 'bg-[#4d96ff] text-white' : 'bg-[#ffecc2] text-[#2b2a33] hover:bg-[#ffd93d]'}`}
                title="تنفيذ بطيء — لمعان أطول لكل بلوك"
              >
                🐢
              </button>
              <button
                onClick={() => setSpeed('normal')}
                className={`px-2 py-1.5 ${speed === 'normal' ? 'bg-[#6bcb77] text-white' : 'bg-[#ffecc2] text-[#2b2a33] hover:bg-[#ffd93d]'}`}
                title="سرعة عادية"
              >
                🐇
              </button>
            </div>
          )}
          {/* Toggle Expand Height */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-xl transition ${doodle ? 'bg-[#ffecc2] hover:bg-[#ffd93d] text-[#2b2a33]' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
            title={isExpanded ? 'تصغير المساحة' : 'تكبير مساحة البرمجة'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveProject}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                savedNotify
                  ? 'bg-emerald-500 text-white'
                  : doodle
                    ? 'bg-[#ffecc2] hover:bg-[#ffd93d] text-[#2b2a33]'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            title="حفظ المشروع بالجهاز"
          >
            {savedNotify ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{savedNotify ? 'تم الحفظ!' : 'حفظ'}</span>
          </button>

          {/* Export File */}
          <button
            onClick={handleExportXML}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                doodle ? 'bg-[#ffecc2] hover:bg-[#ffd93d] text-[#2b2a33]' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            title="تنزيل ملف المشروع XML"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تصدير XML</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleResetWorkspace}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                doodle ? 'bg-[#ffecc2] hover:bg-[#ffd93d] text-[#2b2a33]' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            title="إعادة تعيين مساحة العمل"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">إعادة</span>
          </button>

          {/* Play Live */}
          <button
            onClick={handleRunCode}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-white font-bold text-xs md:text-sm shadow-lg transition transform active:scale-95 ${
                doodle
                  ? 'bg-gradient-to-r from-[#ff6b6b] to-[#ff9f43] hover:brightness-110'
                  : 'hero-glow bg-gradient-to-r from-kid-glow via-orange-500 to-amber-500 hover:brightness-110 shadow-kid-glow/50'
              }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{doodle ? 'شغّل ورقي 🎨' : 'تشغيل الكود 🚀'}</span>
          </button>
        </div>
      </div>

      {/* Blockly Canvas Container - Explicit Flex-1 with min-height */}
      <div className={`relative w-full max-w-full min-w-0 flex-1 min-h-[380px] overflow-hidden isolate ${
          doodle ? 'bg-[#fdfbf4]' : 'bg-slate-950'
        }`}>
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
        <block type="gf_blink"></block>
      </category>
      <category name="🎉 سلوكيات جاهزة" colour="#F59E0B">
        <block type="gf_pattern"></block>
      </category>
      <category name="⏱️ الوقت" colour="#818CF8">
        <block type="gf_wait"></block>
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
      <category name="👀 عيون الشاشة" colour="#22D3EE">
        <block type="gm_set_expression"></block>
        <block type="gm_send_pixel_face"></block>
        <block type="gm_set_custom_face"></block>
      </category>
      <category name="🤖 حركة الرأس" colour="#A78BFA">
        <block type="gm_rotate_head"></block>
        <block type="gm_nod_head"></block>
      </category>
      <category name="🎵 الأصوات والنغمات" colour="#F59E0B">
        <block type="gm_play_sound"></block>
      </category>
      <category name="🎉 سلوكيات جاهزة GM" colour="#0EA5E9">
        <block type="gm_pattern"></block>
      </category>
    `;
  } else {
    modelBlocks = `
      <category name="🚗 قيادة العجلات" colour="#60A5FA">
        <block type="g_drive"></block>
      </category>
      <category name="🦾 مفاصل الأذرع" colour="#A78BFA">
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
      <category name="🔁 التكرار والتحكم" colour="#818CF8">
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
    return `<xml><block type="gm_set_expression" x="40" y="40"><field name="EXPRESSION">0</field><next><block type="gm_rotate_head"><field name="ANGLE">20</field><next><block type="gm_play_sound"><field name="MELODY">victory</field></block></next></block></next></block></xml>`;
  } else {
    return `<xml><block type="g_set_ai_persona" x="40" y="40"><field name="PERSONA">0</field><next><block type="g_move_arms"><field name="ARM_ACTION">both,90</field><next><block type="g_ai_speak"><field name="SPEECH_TEXT">أهلاً بكم يا أبطال البرمجة!</field></block></next></block></next></block></xml>`;
  }
}
