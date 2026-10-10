/** Exact earlier ordinary-question content used only to verify saved-progress migration. */
export const ORDINARY_QUESTION_PREDECESSOR = {
  "version": "2.2-first-meeting-r1:answer-review-v3:questions:choice-feedback-v1:learner-value-v2",
  "items": [
    {
      "id": "Q01",
      "title": {
        "zh-Hant": "內容理解",
        "en": "Comprehension",
        "ja": "内容の理解"
      },
      "stage": "comprehension",
      "sourceRefs": [
        {
          "unit": "T04.s1"
        },
        {
          "unit": "I01.s5"
        },
        {
          "unit": "I01.s3"
        },
        {
          "unit": "T03.s1"
        },
        {
          "unit": "I01.s6"
        }
      ],
      "prompt": {
        "zh-Hant": "對話與短自介中，誰說自己是公司職員？",
        "en": "In the dialogue and short introduction, who says they are a company employee?",
        "ja": "会話と短い自己紹介で、会社員だと言ったのは誰ですか。"
      },
      "options": [
        {
          "id": "A",
          "text": {
            "zh-Hant": "ミナ",
            "en": "Mina",
            "ja": "ミナ"
          }
        },
        {
          "id": "B",
          "text": {
            "zh-Hant": "レン",
            "en": "Ren",
            "ja": "レン"
          }
        }
      ],
      "answer": "B",
      "explanation": {
        "zh-Hant": "レン在對話和短自介中都說「会社員です」（我是公司職員）。ミナ則說自己是學生。",
        "en": "In both the dialogue and short introduction, Ren says 会社員です: “I’m a company employee.” Mina says they are a student.",
        "ja": "会話でも短い自己紹介でも「会社員です」と言っています。ミナは学生です。"
      },
      "responseType": "choice",
      "entryRefs": [
        "draft:ja:polite-noun-predicate"
      ],
      "goalRefs": [
        "L1"
      ],
      "choiceAssessment": {
        "version": "choice-feedback-v1",
        "responseMode": "selection",
        "feedbackByOption": {
          "A": {
            "ja": "ミナは「学生です」と言っています。「会社員です」と言った人を、話者名と一緒に確かめましょう。",
            "zh-Hant": "ミナ說的是「学生です」（我是學生）。請對照說話者，找出誰說「会社員です」（我是公司職員）。",
            "en": "Mina says 学生です (“I’m a student”). Match each line to its speaker to find who says 会社員です (“I’m a company employee”)."
          },
          "B": {
            "ja": "レンは「会社員です」、ミナは「学生です」と言っています。",
            "zh-Hant": "レン說「会社員です」（我是公司職員）；ミナ說「学生です」（我是學生）。",
            "en": "Ren says 会社員です (“I’m a company employee”); Mina says 学生です (“I’m a student”)."
          }
        }
      }
    },
    {
      "id": "Q02",
      "title": {
        "zh-Hant": "內容理解",
        "en": "Comprehension",
        "ja": "内容の理解"
      },
      "stage": "comprehension",
      "sourceRefs": [
        {
          "unit": "W01.s1"
        },
        {
          "unit": "T01.s1"
        },
        {
          "unit": "T02.s1"
        },
        {
          "unit": "I01.s1"
        }
      ],
      "prompt": {
        "zh-Hant": "哪個摘要符合三份素材？",
        "en": "Which summary fits all three materials?",
        "ja": "三つの文章に合う説明はどれですか。"
      },
      "options": [
        {
          "id": "A",
          "text": {
            "zh-Hant": "在讀書會初次見面",
            "en": "A first meeting at a reading group",
            "ja": "読書会で初めて会う場面"
          }
        },
        {
          "id": "B",
          "text": {
            "zh-Hant": "第一天到公司上班時初次見面",
            "en": "A first meeting on the first day at a company job",
            "ja": "会社で働き始めた日に初めて会う場面"
          }
        }
      ],
      "answer": "A",
      "explanation": {
        "zh-Hant": "歡迎訊息中的「読書会」點明活動；「会社員」是レン的身分。",
        "en": "読書会 in the welcome message identifies the activity; 会社員 describes Ren’s role.",
        "ja": "歓迎メッセージの「読書会」が活動を示しています。「会社員」はレンの立場です。"
      },
      "responseType": "choice",
      "entryRefs": [
        "draft:ja:first-meeting-opening"
      ],
      "goalRefs": [
        "L1"
      ],
      "choiceAssessment": {
        "version": "choice-feedback-v1",
        "responseMode": "selection",
        "feedbackByOption": {
          "A": {
            "ja": "歓迎メッセージの「読書会」が活動を示し、「はじめまして」が初対面だと示しています。",
            "zh-Hant": "歡迎訊息中的「読書会」指出活動是讀書會；「はじめまして」表示初次見面。",
            "en": "読書会 in the welcome message identifies the reading group; はじめまして shows that this is a first meeting."
          },
          "B": {
            "ja": "「会社員」はレンの仕事を表します。会っている場面は、歓迎メッセージの「読書会」で確かめられます。",
            "zh-Hant": "「会社員」是レン的職業。見面的場合要看歡迎訊息中的「読書会」，不是看レン的職業。",
            "en": "会社員 describes Ren’s occupation. The setting comes from 読書会 (“reading group”) in the welcome message."
          }
        }
      }
    },
    {
      "id": "Q06",
      "title": {
        "ja": "内容の理解",
        "zh-Hant": "內容理解",
        "en": "Comprehension"
      },
      "stage": "comprehension",
      "sourceRefs": [
        {
          "unit": "I01.s5"
        },
        {
          "unit": "I01.s6"
        }
      ],
      "prompt": {
        "ja": "レンは、メンバーに何と呼んでほしいですか。",
        "zh-Hant": "レン希望成員怎麼稱呼自己？",
        "en": "What does Ren ask the members to call them?"
      },
      "options": [
        {
          "id": "A",
          "text": {
            "ja": "レン",
            "zh-Hant": "レン",
            "en": "Ren"
          }
        },
        {
          "id": "B",
          "text": {
            "ja": "レン・リー",
            "zh-Hant": "レン・リー",
            "en": "Ren Lee"
          }
        }
      ],
      "answer": "A",
      "explanation": {
        "ja": "フルネームを伝えた後、「レンと呼んでください」と頼んでいます。",
        "zh-Hant": "介紹全名後，レン說「レンと呼んでください」，請大家使用簡稱。",
        "en": "After giving the full name, Ren asks to be called Ren."
      },
      "responseType": "choice",
      "entryRefs": [
        "draft:ja:self-naming",
        "draft:ja:preferred-name-request"
      ],
      "goalRefs": [
        "L1"
      ],
      "choiceAssessment": {
        "version": "choice-feedback-v1",
        "responseMode": "selection",
        "feedbackByOption": {
          "A": {
            "ja": "「レンと呼んでください」が、使ってほしい呼び方を示しています。「レン・リーといいます」は名前の紹介です。",
            "zh-Hant": "「レンと呼んでください」是在請大家叫自己レン；「レン・リーといいます」則是在介紹姓名。",
            "en": "レンと呼んでください asks people to use Ren. レン・リーといいます gives the name Ren Lee."
          },
          "B": {
            "ja": "「レン・リーといいます」は名前の紹介です。使ってほしい呼び方は、その後の「レンと呼んでください」で確かめましょう。",
            "zh-Hant": "「レン・リーといいます」是在介紹姓名。想知道レン希望大家怎麼叫自己，要看後面的「レンと呼んでください」。",
            "en": "レン・リーといいます gives the name. For the requested form of address, look at the next sentence: レンと呼んでください (“Please call me Ren”)."
          }
        }
      }
    },
    {
      "id": "Q08",
      "title": {
        "ja": "気持ちを読み取る",
        "zh-Hant": "理解說話者的心情",
        "en": "Understanding the speaker’s feeling"
      },
      "stage": "comprehension",
      "sourceRefs": [
        {
          "unit": "T05.s2"
        }
      ],
      "prompt": {
        "ja": "ミナは「お会いできてうれしいです」で、どんな気持ちを伝えていますか。",
        "zh-Hant": "ミナ說「お会いできてうれしいです」時，表達什麼心情？",
        "en": "What feeling does Mina express with お会いできてうれしいです?"
      },
      "options": [
        {
          "id": "A",
          "text": {
            "ja": "レンに会えてうれしい",
            "zh-Hant": "很高興見到レン",
            "en": "Pleasure at meeting Ren"
          }
        },
        {
          "id": "B",
          "text": {
            "ja": "読書会が終わって残念だ",
            "zh-Hant": "對讀書會結束感到遺憾",
            "en": "Regret that the reading group has ended"
          }
        }
      ],
      "answer": "A",
      "explanation": {
        "ja": "「うれしい」は喜びを表します。ミナは会えたことを喜んでいます。",
        "zh-Hant": "うれしい表示高興；ミナ是在表達見面的喜悅。",
        "en": "うれしい expresses happiness. Mina is pleased that they have met."
      },
      "responseType": "choice",
      "entryRefs": [
        "draft:ja:pleasure-at-meeting"
      ],
      "goalRefs": [
        "L1"
      ],
      "choiceAssessment": {
        "version": "choice-feedback-v1",
        "responseMode": "selection",
        "feedbackByOption": {
          "A": {
            "ja": "「うれしい」は喜びを表します。ここでは、レンに会えたことを喜んでいます。",
            "zh-Hant": "うれしい表達高興；在這句話裡，高興的原因是見到了レン。",
            "en": "うれしい expresses happiness. Here, Mina is happy to meet Ren."
          },
          "B": {
            "ja": "「うれしい」は残念な気持ちではなく、喜びを表します。この文には読書会が終わったという情報もありません。",
            "zh-Hant": "うれしい表達高興，不是遺憾；這句話也沒有說讀書會已經結束。",
            "en": "うれしい expresses happiness, not regret. The sentence also does not say that the reading group has ended."
          }
        }
      }
    },
    {
      "id": "Q04",
      "title": {
        "zh-Hant": "情境判斷",
        "en": "Context choice",
        "ja": "場面を考える"
      },
      "stage": "controlled",
      "sourceRefs": [
        {
          "unit": "T01.s1"
        },
        {
          "unit": "T02.s1"
        }
      ],
      "prompt": {
        "zh-Hant": "下週在同一讀書會再遇到同一個人，還適合用「はじめまして」開場嗎？選一項，簡短說明理由。",
        "en": "Next week, you meet the same person again at the reading group. Is はじめまして a suitable opening? Choose one and briefly explain why.",
        "ja": "来週、同じ読書会で同じ人にまた会います。「はじめまして」であいさつしますか。一つ選んで、理由を短く説明してください。"
      },
      "options": [
        {
          "id": "A",
          "text": {
            "zh-Hant": "適合",
            "en": "Yes",
            "ja": "はい"
          }
        },
        {
          "id": "B",
          "text": {
            "zh-Hant": "不適合",
            "en": "No",
            "ja": "いいえ"
          }
        }
      ],
      "answer": "B",
      "explanation": {
        "zh-Hant": "「はじめまして」用於初次見面，不適合再次見到同一個人。",
        "en": "はじめまして is for a first meeting, not meeting the same person again.",
        "ja": "「はじめまして」は初めて会う時のあいさつで、同じ人との再会には使いません。"
      },
      "responseType": "choice",
      "entryRefs": [
        "draft:ja:first-meeting-opening"
      ],
      "goalRefs": [
        "L2"
      ],
      "choiceAssessment": {
        "version": "choice-feedback-v1",
        "responseMode": "selection-with-reason",
        "feedbackByOption": {
          "A": {
            "ja": "一週間後でも、同じ人にまた会うので、初対面ではありません。「はじめまして」は初めて会う相手へのあいさつです。",
            "zh-Hant": "即使過了一週，再遇到同一個人也不會重新變成初次見面。「はじめまして」是對初次見面的對象說的。",
            "en": "Meeting the same person again a week later is not a first meeting. はじめまして is for someone you are meeting for the first time."
          },
          "B": {
            "ja": "同じ相手にもう一度会うので、初対面のあいさつは使いません。自分の理由にも「同じ人にまた会う」という点が入っているか確認しましょう。",
            "zh-Hant": "因為是再次遇到同一個人，不適合用初次見面的開場。再看看自己的理由是否提到「同一個人、再次見面」。",
            "en": "You are meeting the same person again, so a first-meeting opening does not fit. Check that your reason mentions meeting the same person again."
          }
        }
      }
    },
    {
      "id": "Q05",
      "title": {
        "zh-Hant": "自我表達",
        "en": "Personal expression",
        "ja": "自分で言う・書く"
      },
      "stage": "self-expression",
      "sourceRefs": [
        {
          "unit": "T01.s1"
        },
        {
          "unit": "T01.s2"
        },
        {
          "unit": "T05.s1"
        },
        {
          "unit": "I01.s1"
        },
        {
          "unit": "I01.s5"
        },
        {
          "unit": "I01.s4"
        }
      ],
      "prompt": {
        "zh-Hant": "在讀書會初次見面時，用自選的名字或暱稱說或寫一段自介，包含初見開場、姓名和結語。可以用アキ、ユキ或自己選的名字，不必透露真名或職業。",
        "en": "Say or write a short introduction to someone you are meeting for the first time at a reading group. Include an opening greeting, a name or nickname you choose, and a closing. You can use Aki, Yuki, or another name; you do not need to share your real name or occupation.",
        "ja": "読書会で初めて会う人に、あいさつ、名前、結びを入れて自己紹介を言うか書いてください。アキ、ユキ、または自分で選んだ名前やニックネームを使えます。本名や職業を伝える必要はありません。"
      },
      "options": [
        {
          "id": "N1",
          "text": "アキ"
        },
        {
          "id": "N2",
          "text": "ユキ"
        }
      ],
      "answer": "はじめまして。アキです。よろしくお願いします。\nはじめまして。ユキといいます。よろしくお願いします。",
      "explanation": {
        "zh-Hant": "參考回答只是示範；換成自選名字或暱稱也可以。用下方清單自行檢查。",
        "en": "The sample answers are examples. You can use another name or nickname; check your introduction with the list below.",
        "ja": "解答例の名前は一例です。自分で選んだ名前やニックネームに替えて、下のリストで確認しましょう。"
      },
      "checklist": [
        {
          "zh-Hant": "用了初次見面的開場。",
          "en": "I used a first-meeting greeting.",
          "ja": "初対面のあいさつを使った。"
        },
        {
          "ja": "名前の後に「です」か「といいます」を使い、自分の名前に「さん」を付けなかった。",
          "zh-Hant": "姓名後接です或といいます，自己的姓名不加さん。",
          "en": "I used です or といいます after my name and left off さん."
        },
        {
          "zh-Hant": "用了本課的結語。",
          "en": "I used the lesson’s closing.",
          "ja": "この課の結びを使った。"
        }
      ],
      "modelAnswers": {
        "M1": "はじめまして。アキです。よろしくお願いします。",
        "M2": "はじめまして。ユキといいます。よろしくお願いします。"
      },
      "entryRefs": [
        "draft:ja:first-meeting-opening",
        "draft:ja:cooperative-closing",
        "draft:ja:polite-noun-predicate",
        "draft:ja:self-naming"
      ],
      "goalRefs": [
        "L2"
      ]
    }
  ]
};
