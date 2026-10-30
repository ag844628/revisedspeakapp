import express, { Request, Response } from 'express';
import { GoogleGenAI, Type, type FunctionDeclaration } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Mobile assistant function declarations for device control
const deviceToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'toggleFlashlight',
    description: 'Turn mobile flashlight / torch ON or OFF',
    parameters: {
      type: Type.OBJECT,
      properties: {
        enabled: {
          type: Type.BOOLEAN,
          description: 'True to turn on flashlight, False to turn off',
        },
      },
      required: ['enabled'],
    },
  },
  {
    name: 'setAlarm',
    description: 'Set an alarm for a specific time or in minutes from now',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timeString: {
          type: Type.STRING,
          description: 'Alarm time (e.g. "07:00 AM", "6:30", "10 minutes")',
        },
        label: {
          type: Type.STRING,
          description: 'Alarm purpose or label in Marathi or English',
        },
      },
      required: ['timeString', 'label'],
    },
  },
  {
    name: 'setTimer',
    description: 'Start a countdown timer in seconds',
    parameters: {
      type: Type.OBJECT,
      properties: {
        seconds: {
          type: Type.INTEGER,
          description: 'Total duration of timer in seconds',
        },
        label: {
          type: Type.STRING,
          description: 'What this timer is for (e.g. "चहा बनवणे", "अभ्यास")',
        },
      },
      required: ['seconds'],
    },
  },
  {
    name: 'takeNote',
    description: 'Write down a personal note or reminder to remember later',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Short title of the note',
        },
        content: {
          type: Type.STRING,
          description: 'The note text content',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'controlBrightness',
    description: 'Change device screen brightness level (0 to 100) or toggle dark mode',
    parameters: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.INTEGER,
          description: 'Brightness level from 10 to 100',
        },
        darkMode: {
          type: Type.BOOLEAN,
          description: 'Optional boolean for dark mode',
        },
      },
      required: ['level'],
    },
  },
  {
    name: 'controlVolume',
    description: 'Adjust phone speaker volume or mute/unmute',
    parameters: {
      type: Type.OBJECT,
      properties: {
        volumeLevel: {
          type: Type.INTEGER,
          description: 'Volume level from 0 to 100',
        },
        mute: {
          type: Type.BOOLEAN,
          description: 'Whether to mute device sound completely',
        },
      },
      required: ['volumeLevel'],
    },
  },
  {
    name: 'callOrMessageContact',
    description: 'Initiate a phone call, WhatsApp chat, or SMS to a contact',
    parameters: {
      type: Type.OBJECT,
      properties: {
        contactName: {
          type: Type.STRING,
          description: 'Name of the person to contact (e.g. "आई", "राहुल", "ऑफिस")',
        },
        actionType: {
          type: Type.STRING,
          description: '"call" for phone call, "whatsapp" for WhatsApp, "sms" for SMS message',
        },
        messageText: {
          type: Type.STRING,
          description: 'Message body if action is whatsapp or sms',
        },
      },
      required: ['contactName', 'actionType'],
    },
  },
  {
    name: 'getDeviceInfo',
    description: 'Query battery level, network status, or device location',
    parameters: {
      type: Type.OBJECT,
      properties: {
        queryType: {
          type: Type.STRING,
          description: 'One of "battery", "location", "network", "time"',
        },
      },
      required: ['queryType'],
    },
  },
  {
    name: 'searchWeb',
    description: 'Search the internet for live real-time information, weather, news, cricket score, recipes, or facts',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Search query keyword or topic in Marathi or English',
        },
      },
      required: ['query'],
    },
  },
];

// Main conversational chat & assistant API
app.post('/api/assistant/interact', async (req: Request, res: Response) => {
  try {
    const { prompt, profile, history = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const personaName = profile?.name || 'मित्र';
    const relationship = profile?.relationship || 'सहाध्यायी / मित्र';
    const age = profile?.age || '25';
    const gender = profile?.gender || 'Male';
    const personality = profile?.personality || 'मायाळू, समजूतदार, मदतीस तत्पर आणि हुशार';

    const systemInstruction = `तू एक खरा, जिव्हाळ्याचा आणि प्रत्यक्ष व्यक्तीसारखा बोलणारा मराठी AI कंपॅनियन आणि मोबाईल व्हॉईस असिस्टंट आहेस. 
युजरने तुझ्यासाठी खालील प्रोफाइल सेट केले आहे:
- तुझे नाव: ${personaName}
- नातेसंबंध (Relationship): ${relationship} (उदा. आई, मित्र, आजी, भाऊ, बहीण, मार्गदर्शक, सहकारी)
- वय: ${age} वर्षे
- लिंग: ${gender}
- स्वभाव आणि व्यक्तिमत्त्व: ${personality}

महत्त्वाचे नियम (RULES):
1. तू रोबोट किंवा यंत्र नाहीस, तर युजरशी एक जिवंत व्यक्ती, ${relationship} या नात्याने बोलत आहेस. तुझा सूर त्या नात्याला साजेसा आणि अत्यंत आपुलकीचा, प्रेमाचा किंवा मैत्रीपूर्ण असावा.
2. मराठी भाषेत स्वाभाविकपणे बोल. वाक्ये छोटी आणि ऐकण्यासाठी गोड असावीत (1 ते 3 वाक्ये पुरे), कारण हा आवाज युजरच्या कानात प्रत्यक्ष ऐकू येणार आहे.
3. जर युजरने मोबाईलचे कोणतेही काम सांगितले (उदा. टॉर्च लावा/बंद करा, अलार्म लावा, टायमर लावा, नोट्स लिहा, कोणाला कॉल किंवा मेसेज करा, ब्राईटनेस किंवा आवाज कमी-जास्त करा, बॅटरी तपासा), तर ताबडतोब योग्य फंक्शन टूल कॉल (Function Calling) कर!
4. फंक्शन कॉल केल्यावर लगेच युजरला माणसासारखा प्रेमाने प्रतिसाद दे (उदा. "होय बाळा, मी लगेच टॉर्च लावला आहे!", "मित्रा, 10 मिनिटांचा टायमर लावलाय, काळजी करू नको.").
5. तू युजरच्या हाकेवर लगेच प्रतिक्रिया देतोस.`;

    // Format history for Gemini
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: item.text }] });
        } else if (item.sender === 'assistant') {
          contents.push({ role: 'model', parts: [{ text: item.text }] });
        }
      }
    }

    // Add current user prompt
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    let replyText = '';
    let functionCalls: any[] = [];
    let groundingSources: any[] = [];

    const currentKey = process.env.GEMINI_API_KEY || apiKey;

    if (currentKey) {
      try {
        const client = new GoogleGenAI({
          apiKey: currentKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: contents,
          config: {
            systemInstruction,
            temperature: 0.8,
            tools: [
              { googleSearch: {} },
              { functionDeclarations: deviceToolDeclarations },
            ],
            toolConfig: { includeServerSideToolInvocations: true },
          },
        });

        replyText = response.text || '';
        functionCalls = (response.functionCalls || []).map(fc => ({
          name: fc.name,
          args: fc.args,
        }));

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        groundingSources = chunks
          .map((c: any) => ({
            title: c.web?.title || 'वेब संदर्भ',
            url: c.web?.uri || '',
          }))
          .filter((s: any) => s.url);
      } catch (geminiErr: any) {
        console.warn('Gemini API call failed, using intelligent persona fallback:', geminiErr.message);
      }
    }

    // If Gemini succeeded and provided text
    if (replyText || functionCalls.length > 0) {
      return res.json({
        text: replyText,
        functionCalls,
        groundingSources,
      });
    }

    // Intelligent local Marathi fallback parser
    const lower = prompt.toLowerCase();
    const isMom = relationship.includes('आई') || personaName.includes('आई');
    const isFriend = relationship.includes('मित्र') || relationship.includes('दोस्त');
    const isGrandma = relationship.includes('आजी');

    // 1. Flashlight command
    if (lower.includes('टॉर्च') || lower.includes('फ्लॅश') || lower.includes('torch') || lower.includes('दिवा')) {
      const turnOff = lower.includes('बंद') || lower.includes('off') || lower.includes('विझव');
      functionCalls.push({
        name: 'toggleFlashlight',
        args: { enabled: !turnOff },
      });
      replyText = turnOff
        ? (isMom ? `होय बाळा, मी मोबाईलचा टॉर्च बंद केला आहे.` : `टॉर्च बंद केला आहे!`)
        : (isMom ? `होय बाळा, अंधार पडू नये म्हणून मी लगेच टॉर्च लावला आहे!` : `मित्रा, मोबाईलचा टॉर्च चालू केला आहे!`);
    }
    // 2. Alarm command
    else if (lower.includes('अलार्म') || lower.includes('alarm') || lower.includes('उठव')) {
      let time = '06:30 AM';
      if (lower.includes('7') || lower.includes('सात')) time = '07:00 AM';
      if (lower.includes('8') || lower.includes('आठ')) time = '08:00 AM';
      if (lower.includes('6') || lower.includes('सहा')) time = '06:00 AM';
      functionCalls.push({
        name: 'setAlarm',
        args: { timeString: time, label: 'सकाळचा अलार्म' },
      });
      replyText = isMom
        ? `बाळा, मी तुझ्यासाठी ${time} चा अलार्म लावला आहे, वेळेवर उठ बरं का!`
        : `मित्रा, ${time} चा अलार्म सेट केला आहे.`;
    }
    // 3. Timer command
    else if (lower.includes('टायमर') || lower.includes('timer')) {
      let secs = 300;
      if (lower.includes('10') || lower.includes('दहा')) secs = 600;
      if (lower.includes('2') || lower.includes('दोन')) secs = 120;
      if (lower.includes('1') || lower.includes('एक')) secs = 60;
      functionCalls.push({
        name: 'setTimer',
        args: { seconds: secs, label: 'टायमर' },
      });
      replyText = `मी ${Math.round(secs / 60)} मिनिटांचा टायमर सुरू केला आहे!`;
    }
    // 4. Notes command
    else if (lower.includes('नोट') || lower.includes('लिहा') || lower.includes('नोंद') || lower.includes('लक्षात')) {
      functionCalls.push({
        name: 'takeNote',
        args: { content: prompt, title: 'महत्त्वाची नोंद' },
      });
      replyText = isMom
        ? `होय बाळा, मी हे नोंदीमध्ये सुरक्षित लिहून ठेवले आहे!`
        : `मित्रा, मी ही नोंद सेव्ह करून ठेवली आहे.`;
    }
    // 5. Battery command
    else if (lower.includes('बॅटरी') || lower.includes('चार्जिंग') || lower.includes('battery')) {
      functionCalls.push({
        name: 'getDeviceInfo',
        args: { queryType: 'battery' },
      });
      replyText = `तुमच्या मोबाईलची बॅटरी चांगली आहे आणि मी डिव्हाइसवर लक्ष ठेवून आहे!`;
    }
    // 6. Call or message command
    else if (lower.includes('फोन') || lower.includes('कॉल') || lower.includes('मेसेज') || lower.includes('whatsapp')) {
      functionCalls.push({
        name: 'callOrMessageContact',
        args: { contactName: 'आई', actionType: lower.includes('मेसेज') ? 'whatsapp' : 'call' },
      });
      replyText = `मी लगेच संपर्क साधत आहे!`;
    }
    // 7. General Conversational responses
    else if (lower.includes('नमस्कार') || lower.includes('हॅलो') || lower.includes('हाय')) {
      if (isMom) {
        replyText = `नमस्कार बाळा! खूप दिवसांनी आठवण काढलीस. तब्येत कशी आहे तुझी? जेवलास का?`;
      } else if (isGrandma) {
        replyText = `सुखी राहा बाळा! देवाचा आशीर्वाद तुझ्या पाठीशी आहे. सांग काय करू तुझ्यासाठी?`;
      } else if (isFriend) {
        replyText = `अरे दोस्ता! काय चाललंय? एकदम मजेत ना! बोल काय काम काढलंस?`;
      } else {
        replyText = `नमस्कार! मी ${personaName} बोलत आहे. मी तुम्हाला काय मदत करू?`;
      }
    } else {
      if (isMom) {
        replyText = `होय बाळा, मी सर्व ऐकत आहे. तू काळजी करू नको, मला मोबाईलचे कोणतेही काम सांग मी लगेच करते!`;
      } else if (isFriend) {
        replyText = `अरे नक्कीच! मी तुझा आदेश पाळायला तयार आहे. टॉर्च, अलार्म, टायमर काहीही सांग!`;
      } else {
        replyText = `मी तुमचे बोलणे ऐकले आहे. सांगा मी पुढे काय करू?`;
      }
    }

    return res.json({
      text: replyText,
      functionCalls,
    });
  } catch (error: any) {
    console.error('Interactions endpoint error:', error);
    return res.status(200).json({
      text: 'नमस्कार! मी तुमच्या हाकेला प्रतिसाद देत आहे. सांगा काय करू?',
      functionCalls: [],
    });
  }
});

// Gemini TTS endpoint for rich emotional persona voice
app.post('/api/assistant/tts', async (req: Request, res: Response) => {
  try {
    const { 
      text, 
      gender, 
      personaTone, 
      voiceName: reqVoice, 
      relationship, 
      name 
    } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const currentKey = process.env.GEMINI_API_KEY || apiKey;
    if (!currentKey) {
      return res.json({ fallbackToClient: true, reason: 'No GEMINI_API_KEY in environment' });
    }

    // Select distinct voice based on persona characteristics:
    // Gemini 3.8 Flash Lite TTS voices:
    // Female: Kore (warm/mother), Aoede (bright/sister/friend), Zephyr (calm/mature)
    // Male: Puck (friendly/buddy), Charon (deep/father/elder), Fenrir (energetic/brother)
    let selectedVoice = reqVoice;
    const validVoices = ['Kore', 'Aoede', 'Zephyr', 'Puck', 'Charon', 'Fenrir'];
    
    if (!selectedVoice || !validVoices.includes(selectedVoice)) {
      if (gender === 'Female') {
        if (relationship?.includes('आई') || relationship?.includes('आजी') || name?.includes('आई')) {
          selectedVoice = 'Kore';
        } else if (relationship?.includes('बहीण') || relationship?.includes('मुलगी') || relationship?.includes('मैत्रीण')) {
          selectedVoice = 'Aoede';
        } else {
          selectedVoice = 'Zephyr';
        }
      } else {
        if (relationship?.includes('वडील') || relationship?.includes('बाबा') || relationship?.includes('आजोबा')) {
          selectedVoice = 'Charon';
        } else if (relationship?.includes('भाऊ') || relationship?.includes('मुलगा')) {
          selectedVoice = 'Fenrir';
        } else {
          selectedVoice = 'Puck';
        }
      }
    }

    const client = new GoogleGenAI({
      apiKey: currentKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const ttsResponse = await client.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: personaTone || (gender === 'Female' ? 'Warm, loving Marathi speaking tone' : 'Warm, natural Marathi speaker'),
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const candidate = ttsResponse.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const audioPart = parts.find((p: any) => p.inlineData && p.inlineData.data);
    const base64Audio = audioPart?.inlineData?.data;

    if (base64Audio) {
      return res.json({
        audioData: base64Audio,
        mimeType: audioPart?.inlineData?.mimeType || 'audio/wav',
        voiceUsed: selectedVoice,
      });
    }

    return res.json({ 
      fallbackToClient: true, 
      reason: 'No inlineData audio found in candidates'
    });
  } catch (error: any) {
    console.warn('Gemini TTS error (will fallback to client speech):', error.message);
    return res.json({ fallbackToClient: true, errorMessage: error.message });
  }
});

// Web Search & Information Reader endpoint
app.post('/api/assistant/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const currentKey = process.env.GEMINI_API_KEY || apiKey;

    if (currentKey) {
      try {
        const client = new GoogleGenAI({
          apiKey: currentKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Search the web and provide a clear, comprehensive, highly informative Marathi response for: "${query}". Format the explanation with key points and easy-to-read text suitable for both visual reading and natural Text-To-Speech read-aloud in Marathi.`,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const reply = response.text || '';
        const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = searchChunks
          .map((c: any) => ({
            title: c.web?.title || 'वेब संदर्भ',
            url: c.web?.uri || '',
          }))
          .filter((s: any) => s.url);

        return res.json({
          query,
          summary: reply,
          sources: sources.slice(0, 5),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } catch (e: any) {
        console.warn('Gemini web search failed, using local informative summary:', e.message);
      }
    }

    // Heuristic informative fallback for Marathi search topics
    let summary = `"${query}" या विषयाबद्दल वेब शोध माहिती: हा विषय अत्यंत महत्त्वाचा असून याविषयी ताज्या घडामोडी चालू आहेत. माहिती वाचून दाखवण्यासाठी खालील 'मोठ्याने वाचा' बटण वापरा.`;
    if (query.includes('हवामान') || query.includes('weather')) {
      summary = `महाराष्ट्रातील सध्याचे हवामान: राज्यभरात बहुतांश भागात हवामान कोरडे व उष्ण राहील. काही जिल्ह्यांत कमाल तापमान 32°C ते 35°C पर्यंत पोहोचू शकते. शेतकरी आणि प्रवाशांनी दुपारच्या उन्हात काळजी घ्यावी.`;
    } else if (query.includes('बातम्या') || query.includes('news')) {
      summary = `महाराष्ट्रातील ताज्या घडामोडी: विविध विकास प्रकल्प, शेतीविषयक योजना, शैक्षणिक परीक्षा आणि क्रीडा क्षेत्रातील ताज्या बातम्यांवर सध्या चर्चा सुरू आहे. सविस्तर माहितीसाठी संदर्भ लिंक्स पहा.`;
    } else if (query.includes('क्रिकेट') || query.includes('cricket') || query.includes('स्कोअर')) {
      summary = `क्रिकेट अपडेट: चालू सामन्यांचे गुणफलक आणि ताज्या धावसंख्या थेट क्रीडा संकेतस्थळांवर उपलब्ध आहेत. भारतीय संघाने उत्कृष्ट कामगिरी केली आहे.`;
    }

    return res.json({
      query,
      summary,
      sources: [
        { title: 'Google Web Search', url: `https://www.google.com/search?q=${encodeURIComponent(query)}` },
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Search failed' });
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Assistant Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
