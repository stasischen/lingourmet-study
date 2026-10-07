export const LOCALES=['zh-Hant','en','ja'];
export const h=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const localize=(value,locale)=>typeof value==='string'?value:value&&Object.hasOwn(value,locale)&&typeof value[locale]==='string'?value[locale]:'';
export const t=(value,locale)=>h(localize(value,locale)).replace(/\n/g,'<br>');
export const UI={
 'zh-Hant':{skip:'跳到內容',loading:'載入中…',interfaceLanguage:'介面語言',language:'教學語言',content:'內容',teaching:'教學',practice:'練習',draft:'第一課',goals:'學習目標',meaning:'意思',sentence:'句意',chunk:'閱讀分段',span:'表達',token:'詞語',selection:'原文',missing:'暫無譯義。',source:'查看原文',openEntry:'完整說明',related:'相關內容',examples:'例句',context:'本課情境',reveal:'答案',sample:'參考回答',selfCheck:'自我檢核',write:'回答',answer:'答案',explanation:'說明',alternatives:'其他說法',readingNotes:'閱讀提示',nextTeaching:'教學 →',nextPractice:'練習 →',top:'內容 ↑',back:'第一課',entryDraft:'語言筆記',footer:'練習回答與自評保存在這個瀏覽器。',error:'課程無法載入，請稍後重新整理。',entryMissing:'找不到這則說明。',close:'關閉'},
 en:{skip:'Skip to content',loading:'Loading…',interfaceLanguage:'Interface language',language:'Teaching language',content:'Content',teaching:'Teaching',practice:'Practice',draft:'Lesson 1',goals:'Learning goals',meaning:'Meaning',sentence:'Sentence meaning',chunk:'Reading segment',span:'Expression',token:'Word',selection:'Original text',missing:'Meaning unavailable.',source:'View original',openEntry:'Full explanation',related:'Related topics',examples:'Example',context:'In this lesson',reveal:'Answer',sample:'Sample responses',selfCheck:'Self-check',write:'Your answer',answer:'Answer',explanation:'Explanation',alternatives:'Other possibilities',readingNotes:'Reading notes',nextTeaching:'Teaching →',nextPractice:'Practice →',top:'Content ↑',back:'Lesson 1',entryDraft:'Language notes',footer:'Practice responses and self-checks are saved in this browser.',error:'The lesson could not be loaded. Please refresh later.',entryMissing:'This explanation was not found.',close:'Close'},
 ja:{skip:'本文へ',loading:'読み込み中…',interfaceLanguage:'表示言語',language:'説明の言語',content:'本文',teaching:'解説',practice:'練習',draft:'第1課',goals:'学習目標',meaning:'意味',sentence:'文の意味',chunk:'読むまとまり',span:'表現',token:'ことば',selection:'本文',missing:'この言語の訳はまだありません。',source:'本文を見る',openEntry:'詳しい説明',related:'関連する内容',examples:'例文',context:'この課の場面',reveal:'答え',sample:'解答例',selfCheck:'確認ポイント',write:'回答',answer:'答え',explanation:'説明',alternatives:'ほかの言い方',readingNotes:'読むためのヒント',nextTeaching:'解説へ →',nextPractice:'練習へ →',top:'本文へ ↑',back:'第1課',entryDraft:'ことばのノート',footer:'練習の回答と自己評価は、このブラウザーに保存されます。',error:'レッスンを読み込めませんでした。後でもう一度お試しください。',entryMissing:'この説明が見つかりません。',close:'閉じる'}
};

Object.assign(UI['zh-Hant'],{play:'播放日語發音',audioUnavailable:'這個裝置目前沒有可用的本機日語語音。',audioHidden:'看答案後才能播放。',audioError:'發音未能播放，請再試一次。',audioSpeaking:'正在播放…',audioPending:'準備播放…'});
Object.assign(UI.en,{play:'Play Japanese pronunciation',audioUnavailable:'No local Japanese voice is available on this device.',audioHidden:'Show the answer before playing it.',audioError:'Pronunciation could not play. Please try again.',audioSpeaking:'Playing…',audioPending:'Preparing audio…'});
Object.assign(UI.ja,{play:'日本語の発音を聞く',audioUnavailable:'この端末には、利用できる日本語のローカル音声がありません。',audioHidden:'答えを見てから再生できます。',audioError:'発音を再生できませんでした。もう一度お試しください。',audioSpeaking:'再生中…',audioPending:'再生の準備中…'});


UI['zh-Hant'].backContent='回到內容';UI.en.backContent='Back to content';UI.ja.backContent='本文に戻る';

Object.assign(UI['zh-Hant'],{showTranslations:'顯示翻譯',hideTranslations:'隱藏翻譯'});
Object.assign(UI.en,{showTranslations:'Show translations',hideTranslations:'Hide translations'});
Object.assign(UI.ja,{showTranslations:'訳を表示',hideTranslations:'訳を隠す'});

Object.assign(UI['zh-Hant'],{lemma:'原形',pos:'詞類',grammar:'文法',parts:'組成',dictionary:'辭典'});
Object.assign(UI.en,{lemma:'Base form',pos:'Part of speech',grammar:'Grammar',parts:'Parts',dictionary:'Dictionary'});
Object.assign(UI.ja,{lemma:'基本形',pos:'品詞',grammar:'文法',parts:'構成',dictionary:'辞書'});

UI['zh-Hant'].usage='用法';UI.en.usage='Usage';UI.ja.usage='使い方';

Object.assign(UI['zh-Hant'],{cardScope:'翻卡範圍',lexicalCards:'詞語與表達',sentenceCards:'原句'});Object.assign(UI.en,{cardScope:'Card set',lexicalCards:'Words and expressions',sentenceCards:'Sentences'});Object.assign(UI.ja,{cardScope:'カードの範囲',lexicalCards:'ことば・表現',sentenceCards:'文'});

Object.assign(UI['zh-Hant'],{cardProduction:'看意思，想原文',cardListening:'聽原文，想意思',cardPlay:'播放原文'});Object.assign(UI.en,{cardProduction:'Read the meaning, recall the Japanese',cardListening:'Listen, recall the meaning',cardPlay:'Play Japanese'});Object.assign(UI.ja,{cardProduction:'意味を見て原文を思い出す',cardListening:'原文を聞いて意味を思い出す',cardPlay:'原文を再生'});

Object.assign(UI['zh-Hant'],{selectedTitle:'自選',addSelected:'加入自選',removeSelected:'移出自選',selectedEmpty:'尚未加入句子或詞語。',practiceSelectedCards:'練習自選翻卡',practiceSelectedSentences:'自選句子組句',selectedSaveError:'自選清單未能儲存，請重試。',selectedReadError:'自選清單無法讀取，原記錄已保留。',selectedRetry:'重試',selectedStale:'內容已更新，這一項需要重新加入。',selectedUnavailable:'這一項目前無法練習。'});
Object.assign(UI.en,{selectedTitle:'My selections',addSelected:'Add to my selections',removeSelected:'Remove from my selections',selectedEmpty:'No sentences or words selected yet.',practiceSelectedCards:'Practice selected flashcards',practiceSelectedSentences:'Build selected sentences',selectedSaveError:'Your selection could not be saved. Please retry.',selectedReadError:'Your selections could not be read. The saved record has been preserved.',selectedRetry:'Retry',selectedStale:'This content has changed. Select it again to practice.',selectedUnavailable:'This selection is not available for practice.'});
Object.assign(UI.ja,{selectedTitle:'選択リスト',addSelected:'リストに追加',removeSelected:'リストから削除',selectedEmpty:'文やことばはまだ選ばれていません。',practiceSelectedCards:'選んだカードを練習',practiceSelectedSentences:'選んだ文を組み立てる',selectedSaveError:'選択リストを保存できませんでした。もう一度お試しください。',selectedReadError:'選択リストを読み込めませんでした。保存済みの記録は残っています。',selectedRetry:'再試行',selectedStale:'内容が更新されています。もう一度選び直してください。',selectedUnavailable:'この項目は現在練習できません。'});

UI['zh-Hant'].lessonPractice='課程練習';UI.en.lessonPractice='Lesson practice';UI.ja.lessonPractice='レッスンの練習';

UI['zh-Hant'].selectedAssemblyUnavailable='這個句子目前無法組句練習。';UI.en.selectedAssemblyUnavailable='Sentence building is unavailable for this selection.';UI.ja.selectedAssemblyUnavailable='この文は現在、並べ替え練習に使えません。';

Object.assign(UI['zh-Hant'],{catalogTitle:'文法與表達',catalogSearch:'搜尋筆記',catalogNoResults:'找不到符合的筆記。',catalogLoadError:'筆記無法載入，請稍後重新整理。',catalogUnavailable:'筆記資料不完整，目前無法搜尋。',catalogBack:'回到筆記目錄'});
Object.assign(UI.en,{catalogTitle:'Grammar and expressions',catalogSearch:'Search notes',catalogNoResults:'No matching notes.',catalogLoadError:'The notes could not be loaded. Please refresh later.',catalogUnavailable:'The notes are incomplete and cannot be searched right now.',catalogBack:'Back to notes'});
Object.assign(UI.ja,{catalogTitle:'文法・表現',catalogSearch:'ノートを検索',catalogNoResults:'一致するノートがありません。',catalogLoadError:'ノートを読み込めませんでした。後でもう一度お試しください。',catalogUnavailable:'ノートのデータが不足しているため、現在検索できません。',catalogBack:'ノート一覧に戻る'});
Object.assign(UI['zh-Hant'],{detailStructure:'句型結構',detailPronunciation:'發音',detailRegister:'場合與語氣',detailResponse:'回應',detailLimits:'適用範圍',detailUnavailable:'完整說明目前無法載入。'});
Object.assign(UI.en,{detailStructure:'Sentence structure',detailPronunciation:'Pronunciation',detailRegister:'Situation and tone',detailResponse:'Responding',detailLimits:'Usage limits',detailUnavailable:'The full explanation is unavailable right now.'});
Object.assign(UI.ja,{detailStructure:'文の組み立て',detailPronunciation:'発音',detailRegister:'場面と言い方',detailResponse:'応答',detailLimits:'使える範囲',detailUnavailable:'詳しい説明は現在読み込めません。'});

Object.assign(UI['zh-Hant'],{lessonPractice:'問答',lessonAssembly:'組句'});Object.assign(UI.en,{lessonPractice:'Questions',lessonAssembly:'Sentence building'});Object.assign(UI.ja,{lessonPractice:'問答',lessonAssembly:'文の並べ替え'});
