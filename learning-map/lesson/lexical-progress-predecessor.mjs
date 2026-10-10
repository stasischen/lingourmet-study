/** Exact prior lexical card facts for bounded copy-revision migration. */
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const LEXICAL_COPY_PREDECESSOR=freeze({
  "version": "source-lexical-v1",
  "cards": [
    {
      "card": {
        "id": "flash:recognition:lesson01.lexical.reading-group",
        "template": "recognition",
        "unit": "lexical:lesson01.lexical.reading-group",
        "sourceRefs": [
          {
            "unit": "W01.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.reading-group\",\"practiceVersion\":1,\"template\":\"recognition\",\"target\":{\"document\":\"lesson\",\"unitId\":\"W01.s1\",\"tokenId\":\"t1\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"読書会\",\"reading\":\"どくしょかい\",\"ruby\":[{\"text\":\"読書会\",\"reading\":\"どくしょかい\"}]}]}",
        "lexicalRef": "lesson:W01.s1:t1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.reading-group",
        "tokens": [
          {
            "id": "t1",
            "text": "読書会",
            "reading": "どくしょかい",
            "ruby": [
              {
                "text": "読書会",
                "reading": "どくしょかい"
              }
            ]
          }
        ],
        "meanings": {
          "zh-Hant": "讀書會",
          "en": "reading group",
          "ja": "本を読んで感想を話し合う集まり"
        },
        "sourceRefs": [
          {
            "unit": "W01.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "lexicalRef": "lesson:W01.s1:t1"
      }
    },
    {
      "card": {
        "id": "flash:production:lesson01.lexical.reading-group",
        "template": "production",
        "unit": "lexical:lesson01.lexical.reading-group",
        "sourceRefs": [
          {
            "unit": "W01.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.reading-group\",\"practiceVersion\":1,\"template\":\"production\",\"target\":{\"document\":\"lesson\",\"unitId\":\"W01.s1\",\"tokenId\":\"t1\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"読書会\",\"reading\":\"どくしょかい\",\"ruby\":[{\"text\":\"読書会\",\"reading\":\"どくしょかい\"}]}]}",
        "lexicalRef": "lesson:W01.s1:t1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.reading-group",
        "tokens": [
          {
            "id": "t1",
            "text": "読書会",
            "reading": "どくしょかい",
            "ruby": [
              {
                "text": "読書会",
                "reading": "どくしょかい"
              }
            ]
          }
        ],
        "meanings": {
          "zh-Hant": "讀書會",
          "en": "reading group",
          "ja": "本を読んで感想を話し合う集まり"
        },
        "sourceRefs": [
          {
            "unit": "W01.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "lexicalRef": "lesson:W01.s1:t1"
      }
    },
    {
      "card": {
        "id": "flash:listening:lesson01.lexical.reading-group",
        "template": "listening",
        "unit": "lexical:lesson01.lexical.reading-group",
        "sourceRefs": [
          {
            "unit": "W01.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.reading-group\",\"practiceVersion\":1,\"template\":\"listening\",\"target\":{\"document\":\"lesson\",\"unitId\":\"W01.s1\",\"tokenId\":\"t1\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"読書会\",\"reading\":\"どくしょかい\",\"ruby\":[{\"text\":\"読書会\",\"reading\":\"どくしょかい\"}]}]}",
        "lexicalRef": "lesson:W01.s1:t1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.reading-group",
        "tokens": [
          {
            "id": "t1",
            "text": "読書会",
            "reading": "どくしょかい",
            "ruby": [
              {
                "text": "読書会",
                "reading": "どくしょかい"
              }
            ]
          }
        ],
        "meanings": {
          "zh-Hant": "讀書會",
          "en": "reading group",
          "ja": "本を読んで感想を話し合う集まり"
        },
        "sourceRefs": [
          {
            "unit": "W01.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "lexicalRef": "lesson:W01.s1:t1"
      }
    },
    {
      "card": {
        "id": "flash:recognition:lesson01.lexical.company-employee",
        "template": "recognition",
        "unit": "lexical:lesson01.lexical.company-employee",
        "sourceRefs": [
          {
            "unit": "I01.s3",
            "from": "t1",
            "to": "t1"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.company-employee\",\"practiceVersion\":1,\"template\":\"recognition\",\"target\":{\"document\":\"lesson\",\"unitId\":\"I01.s3\",\"tokenId\":\"t1\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"会社員\",\"reading\":\"かいしゃいん\",\"ruby\":[{\"text\":\"会社員\",\"reading\":\"かいしゃいん\"}]}]}",
        "lexicalRef": "lesson:I01.s3:t1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.company-employee",
        "tokens": [
          {
            "id": "t1",
            "text": "会社員",
            "reading": "かいしゃいん",
            "ruby": [
              {
                "text": "会社員",
                "reading": "かいしゃいん"
              }
            ]
          }
        ],
        "meanings": {
          "zh-Hant": "公司職員",
          "en": "company employee",
          "ja": "会社に勤めている人"
        },
        "sourceRefs": [
          {
            "unit": "I01.s3",
            "from": "t1",
            "to": "t1"
          }
        ],
        "lexicalRef": "lesson:I01.s3:t1"
      }
    },
    {
      "card": {
        "id": "flash:production:lesson01.lexical.company-employee",
        "template": "production",
        "unit": "lexical:lesson01.lexical.company-employee",
        "sourceRefs": [
          {
            "unit": "I01.s3",
            "from": "t1",
            "to": "t1"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.company-employee\",\"practiceVersion\":1,\"template\":\"production\",\"target\":{\"document\":\"lesson\",\"unitId\":\"I01.s3\",\"tokenId\":\"t1\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"会社員\",\"reading\":\"かいしゃいん\",\"ruby\":[{\"text\":\"会社員\",\"reading\":\"かいしゃいん\"}]}]}",
        "lexicalRef": "lesson:I01.s3:t1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.company-employee",
        "tokens": [
          {
            "id": "t1",
            "text": "会社員",
            "reading": "かいしゃいん",
            "ruby": [
              {
                "text": "会社員",
                "reading": "かいしゃいん"
              }
            ]
          }
        ],
        "meanings": {
          "zh-Hant": "公司職員",
          "en": "company employee",
          "ja": "会社に勤めている人"
        },
        "sourceRefs": [
          {
            "unit": "I01.s3",
            "from": "t1",
            "to": "t1"
          }
        ],
        "lexicalRef": "lesson:I01.s3:t1"
      }
    },
    {
      "card": {
        "id": "flash:listening:lesson01.lexical.company-employee",
        "template": "listening",
        "unit": "lexical:lesson01.lexical.company-employee",
        "sourceRefs": [
          {
            "unit": "I01.s3",
            "from": "t1",
            "to": "t1"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.company-employee\",\"practiceVersion\":1,\"template\":\"listening\",\"target\":{\"document\":\"lesson\",\"unitId\":\"I01.s3\",\"tokenId\":\"t1\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"会社員\",\"reading\":\"かいしゃいん\",\"ruby\":[{\"text\":\"会社員\",\"reading\":\"かいしゃいん\"}]}]}",
        "lexicalRef": "lesson:I01.s3:t1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.company-employee",
        "tokens": [
          {
            "id": "t1",
            "text": "会社員",
            "reading": "かいしゃいん",
            "ruby": [
              {
                "text": "会社員",
                "reading": "かいしゃいん"
              }
            ]
          }
        ],
        "meanings": {
          "zh-Hant": "公司職員",
          "en": "company employee",
          "ja": "会社に勤めている人"
        },
        "sourceRefs": [
          {
            "unit": "I01.s3",
            "from": "t1",
            "to": "t1"
          }
        ],
        "lexicalRef": "lesson:I01.s3:t1"
      }
    },
    {
      "card": {
        "id": "flash:recognition:lesson01.lexical.first-meeting",
        "template": "recognition",
        "unit": "lexical:lesson01.lexical.first-meeting",
        "sourceRefs": [
          {
            "unit": "T01.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.first-meeting\",\"practiceVersion\":1,\"template\":\"recognition\",\"target\":{\"document\":\"lesson\",\"unitId\":\"T01.s1\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t1\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"はじめまして\"}]}",
        "lexicalRef": "lesson:T01.s1:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.first-meeting",
        "tokens": [
          {
            "id": "t1",
            "text": "はじめまして"
          }
        ],
        "meanings": {
          "zh-Hant": "初次見面，你好",
          "en": "Nice to meet you.",
          "ja": "初対面のあいさつ"
        },
        "sourceRefs": [
          {
            "unit": "T01.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "lexicalRef": "lesson:T01.s1:e1"
      }
    },
    {
      "card": {
        "id": "flash:production:lesson01.lexical.first-meeting",
        "template": "production",
        "unit": "lexical:lesson01.lexical.first-meeting",
        "sourceRefs": [
          {
            "unit": "T01.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.first-meeting\",\"practiceVersion\":1,\"template\":\"production\",\"target\":{\"document\":\"lesson\",\"unitId\":\"T01.s1\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t1\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"はじめまして\"}]}",
        "lexicalRef": "lesson:T01.s1:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.first-meeting",
        "tokens": [
          {
            "id": "t1",
            "text": "はじめまして"
          }
        ],
        "meanings": {
          "zh-Hant": "初次見面，你好",
          "en": "Nice to meet you.",
          "ja": "初対面のあいさつ"
        },
        "sourceRefs": [
          {
            "unit": "T01.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "lexicalRef": "lesson:T01.s1:e1"
      }
    },
    {
      "card": {
        "id": "flash:listening:lesson01.lexical.first-meeting",
        "template": "listening",
        "unit": "lexical:lesson01.lexical.first-meeting",
        "sourceRefs": [
          {
            "unit": "T01.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.first-meeting\",\"practiceVersion\":1,\"template\":\"listening\",\"target\":{\"document\":\"lesson\",\"unitId\":\"T01.s1\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t1\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"はじめまして\"}]}",
        "lexicalRef": "lesson:T01.s1:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.first-meeting",
        "tokens": [
          {
            "id": "t1",
            "text": "はじめまして"
          }
        ],
        "meanings": {
          "zh-Hant": "初次見面，你好",
          "en": "Nice to meet you.",
          "ja": "初対面のあいさつ"
        },
        "sourceRefs": [
          {
            "unit": "T01.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "lexicalRef": "lesson:T01.s1:e1"
      }
    },
    {
      "card": {
        "id": "flash:recognition:lesson01.lexical.goodwill-greeting",
        "template": "recognition",
        "unit": "lexical:lesson01.lexical.goodwill-greeting",
        "sourceRefs": [
          {
            "unit": "T05.s1",
            "from": "t1",
            "to": "t2"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.goodwill-greeting\",\"practiceVersion\":1,\"template\":\"recognition\",\"target\":{\"document\":\"lesson\",\"unitId\":\"T05.s1\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t2\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"よろしく\"},{\"id\":\"t2\",\"text\":\"お願いします\",\"reading\":\"おねがいします\",\"ruby\":[{\"text\":\"お\"},{\"text\":\"願\",\"reading\":\"ねが\"},{\"text\":\"いします\"}]}]}",
        "lexicalRef": "lesson:T05.s1:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.goodwill-greeting",
        "tokens": [
          {
            "id": "t1",
            "text": "よろしく"
          },
          {
            "id": "t2",
            "text": "お願いします",
            "reading": "おねがいします",
            "ruby": [
              {
                "text": "お"
              },
              {
                "text": "願",
                "reading": "ねが"
              },
              {
                "text": "いします"
              }
            ]
          }
        ],
        "meanings": {
          "zh-Hant": "請多關照",
          "en": "I look forward to getting to know you.",
          "ja": "これからのよい関係を願うあいさつ"
        },
        "sourceRefs": [
          {
            "unit": "T05.s1",
            "from": "t1",
            "to": "t2"
          }
        ],
        "lexicalRef": "lesson:T05.s1:e1"
      }
    },
    {
      "card": {
        "id": "flash:production:lesson01.lexical.goodwill-greeting",
        "template": "production",
        "unit": "lexical:lesson01.lexical.goodwill-greeting",
        "sourceRefs": [
          {
            "unit": "T05.s1",
            "from": "t1",
            "to": "t2"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.goodwill-greeting\",\"practiceVersion\":1,\"template\":\"production\",\"target\":{\"document\":\"lesson\",\"unitId\":\"T05.s1\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t2\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"よろしく\"},{\"id\":\"t2\",\"text\":\"お願いします\",\"reading\":\"おねがいします\",\"ruby\":[{\"text\":\"お\"},{\"text\":\"願\",\"reading\":\"ねが\"},{\"text\":\"いします\"}]}]}",
        "lexicalRef": "lesson:T05.s1:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.goodwill-greeting",
        "tokens": [
          {
            "id": "t1",
            "text": "よろしく"
          },
          {
            "id": "t2",
            "text": "お願いします",
            "reading": "おねがいします",
            "ruby": [
              {
                "text": "お"
              },
              {
                "text": "願",
                "reading": "ねが"
              },
              {
                "text": "いします"
              }
            ]
          }
        ],
        "meanings": {
          "zh-Hant": "請多關照",
          "en": "I look forward to getting to know you.",
          "ja": "これからのよい関係を願うあいさつ"
        },
        "sourceRefs": [
          {
            "unit": "T05.s1",
            "from": "t1",
            "to": "t2"
          }
        ],
        "lexicalRef": "lesson:T05.s1:e1"
      }
    },
    {
      "card": {
        "id": "flash:listening:lesson01.lexical.goodwill-greeting",
        "template": "listening",
        "unit": "lexical:lesson01.lexical.goodwill-greeting",
        "sourceRefs": [
          {
            "unit": "T05.s1",
            "from": "t1",
            "to": "t2"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.goodwill-greeting\",\"practiceVersion\":1,\"template\":\"listening\",\"target\":{\"document\":\"lesson\",\"unitId\":\"T05.s1\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t2\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"よろしく\"},{\"id\":\"t2\",\"text\":\"お願いします\",\"reading\":\"おねがいします\",\"ruby\":[{\"text\":\"お\"},{\"text\":\"願\",\"reading\":\"ねが\"},{\"text\":\"いします\"}]}]}",
        "lexicalRef": "lesson:T05.s1:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.goodwill-greeting",
        "tokens": [
          {
            "id": "t1",
            "text": "よろしく"
          },
          {
            "id": "t2",
            "text": "お願いします",
            "reading": "おねがいします",
            "ruby": [
              {
                "text": "お"
              },
              {
                "text": "願",
                "reading": "ねが"
              },
              {
                "text": "いします"
              }
            ]
          }
        ],
        "meanings": {
          "zh-Hant": "請多關照",
          "en": "I look forward to getting to know you.",
          "ja": "これからのよい関係を願うあいさつ"
        },
        "sourceRefs": [
          {
            "unit": "T05.s1",
            "from": "t1",
            "to": "t2"
          }
        ],
        "lexicalRef": "lesson:T05.s1:e1"
      }
    },
    {
      "card": {
        "id": "flash:recognition:lesson01.lexical.reciprocal-greeting",
        "template": "recognition",
        "unit": "lexical:lesson01.lexical.reciprocal-greeting",
        "sourceRefs": [
          {
            "unit": "T06.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.reciprocal-greeting\",\"practiceVersion\":1,\"template\":\"recognition\",\"target\":{\"document\":\"lesson\",\"unitId\":\"T06.s1\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t1\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"こちらこそ\"}]}",
        "lexicalRef": "lesson:T06.s1:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.reciprocal-greeting",
        "tokens": [
          {
            "id": "t1",
            "text": "こちらこそ"
          }
        ],
        "meanings": {
          "zh-Hant": "彼此彼此",
          "en": "Likewise.",
          "ja": "私も同じ気持ちです"
        },
        "sourceRefs": [
          {
            "unit": "T06.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "lexicalRef": "lesson:T06.s1:e1"
      }
    },
    {
      "card": {
        "id": "flash:production:lesson01.lexical.reciprocal-greeting",
        "template": "production",
        "unit": "lexical:lesson01.lexical.reciprocal-greeting",
        "sourceRefs": [
          {
            "unit": "T06.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.reciprocal-greeting\",\"practiceVersion\":1,\"template\":\"production\",\"target\":{\"document\":\"lesson\",\"unitId\":\"T06.s1\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t1\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"こちらこそ\"}]}",
        "lexicalRef": "lesson:T06.s1:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.reciprocal-greeting",
        "tokens": [
          {
            "id": "t1",
            "text": "こちらこそ"
          }
        ],
        "meanings": {
          "zh-Hant": "彼此彼此",
          "en": "Likewise.",
          "ja": "私も同じ気持ちです"
        },
        "sourceRefs": [
          {
            "unit": "T06.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "lexicalRef": "lesson:T06.s1:e1"
      }
    },
    {
      "card": {
        "id": "flash:listening:lesson01.lexical.reciprocal-greeting",
        "template": "listening",
        "unit": "lexical:lesson01.lexical.reciprocal-greeting",
        "sourceRefs": [
          {
            "unit": "T06.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.reciprocal-greeting\",\"practiceVersion\":1,\"template\":\"listening\",\"target\":{\"document\":\"lesson\",\"unitId\":\"T06.s1\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t1\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"こちらこそ\"}]}",
        "lexicalRef": "lesson:T06.s1:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.reciprocal-greeting",
        "tokens": [
          {
            "id": "t1",
            "text": "こちらこそ"
          }
        ],
        "meanings": {
          "zh-Hant": "彼此彼此",
          "en": "Likewise.",
          "ja": "私も同じ気持ちです"
        },
        "sourceRefs": [
          {
            "unit": "T06.s1",
            "from": "t1",
            "to": "t1"
          }
        ],
        "lexicalRef": "lesson:T06.s1:e1"
      }
    },
    {
      "card": {
        "id": "flash:recognition:lesson01.lexical.self-naming",
        "template": "recognition",
        "unit": "lexical:lesson01.lexical.self-naming",
        "sourceRefs": [
          {
            "unit": "I01.s5",
            "from": "t1",
            "to": "t3"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.self-naming\",\"practiceVersion\":1,\"template\":\"recognition\",\"target\":{\"document\":\"catalog\",\"unitId\":\"I01.s5\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t3\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"レン・リー\"},{\"id\":\"t2\",\"text\":\"と\"},{\"id\":\"t3\",\"text\":\"いいます\"}]}",
        "lexicalRef": "catalog:I01.s5:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.self-naming",
        "tokens": [
          {
            "id": "t1",
            "text": "レン・リー"
          },
          {
            "id": "t2",
            "text": "と"
          },
          {
            "id": "t3",
            "text": "いいます"
          }
        ],
        "meanings": {
          "zh-Hant": "我叫レン・リー",
          "en": "My name is Ren Lee",
          "ja": "自分の名前はレン・リーだと伝えています"
        },
        "sourceRefs": [
          {
            "unit": "I01.s5",
            "from": "t1",
            "to": "t3"
          }
        ],
        "lexicalRef": "catalog:I01.s5:e1"
      }
    },
    {
      "card": {
        "id": "flash:production:lesson01.lexical.self-naming",
        "template": "production",
        "unit": "lexical:lesson01.lexical.self-naming",
        "sourceRefs": [
          {
            "unit": "I01.s5",
            "from": "t1",
            "to": "t3"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.self-naming\",\"practiceVersion\":1,\"template\":\"production\",\"target\":{\"document\":\"catalog\",\"unitId\":\"I01.s5\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t3\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"レン・リー\"},{\"id\":\"t2\",\"text\":\"と\"},{\"id\":\"t3\",\"text\":\"いいます\"}]}",
        "lexicalRef": "catalog:I01.s5:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.self-naming",
        "tokens": [
          {
            "id": "t1",
            "text": "レン・リー"
          },
          {
            "id": "t2",
            "text": "と"
          },
          {
            "id": "t3",
            "text": "いいます"
          }
        ],
        "meanings": {
          "zh-Hant": "我叫レン・リー",
          "en": "My name is Ren Lee",
          "ja": "自分の名前はレン・リーだと伝えています"
        },
        "sourceRefs": [
          {
            "unit": "I01.s5",
            "from": "t1",
            "to": "t3"
          }
        ],
        "lexicalRef": "catalog:I01.s5:e1"
      }
    },
    {
      "card": {
        "id": "flash:listening:lesson01.lexical.self-naming",
        "template": "listening",
        "unit": "lexical:lesson01.lexical.self-naming",
        "sourceRefs": [
          {
            "unit": "I01.s5",
            "from": "t1",
            "to": "t3"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.self-naming\",\"practiceVersion\":1,\"template\":\"listening\",\"target\":{\"document\":\"catalog\",\"unitId\":\"I01.s5\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t3\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"レン・リー\"},{\"id\":\"t2\",\"text\":\"と\"},{\"id\":\"t3\",\"text\":\"いいます\"}]}",
        "lexicalRef": "catalog:I01.s5:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.self-naming",
        "tokens": [
          {
            "id": "t1",
            "text": "レン・リー"
          },
          {
            "id": "t2",
            "text": "と"
          },
          {
            "id": "t3",
            "text": "いいます"
          }
        ],
        "meanings": {
          "zh-Hant": "我叫レン・リー",
          "en": "My name is Ren Lee",
          "ja": "自分の名前はレン・リーだと伝えています"
        },
        "sourceRefs": [
          {
            "unit": "I01.s5",
            "from": "t1",
            "to": "t3"
          }
        ],
        "lexicalRef": "catalog:I01.s5:e1"
      }
    },
    {
      "card": {
        "id": "flash:recognition:lesson01.lexical.preferred-name",
        "template": "recognition",
        "unit": "lexical:lesson01.lexical.preferred-name",
        "sourceRefs": [
          {
            "unit": "I01.s6",
            "from": "t1",
            "to": "t4"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.preferred-name\",\"practiceVersion\":1,\"template\":\"recognition\",\"target\":{\"document\":\"catalog\",\"unitId\":\"I01.s6\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t4\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"レン\"},{\"id\":\"t2\",\"text\":\"と\"},{\"id\":\"t3\",\"text\":\"呼んで\",\"reading\":\"よんで\",\"ruby\":[{\"text\":\"呼んで\",\"reading\":\"よんで\"}]},{\"id\":\"t4\",\"text\":\"ください\"}]}",
        "lexicalRef": "catalog:I01.s6:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.preferred-name",
        "tokens": [
          {
            "id": "t1",
            "text": "レン"
          },
          {
            "id": "t2",
            "text": "と"
          },
          {
            "id": "t3",
            "text": "呼んで",
            "reading": "よんで",
            "ruby": [
              {
                "text": "呼んで",
                "reading": "よんで"
              }
            ]
          },
          {
            "id": "t4",
            "text": "ください"
          }
        ],
        "meanings": {
          "zh-Hant": "請叫我レン",
          "en": "Please call me Ren",
          "ja": "レンという名前で呼んでほしいと頼んでいます"
        },
        "sourceRefs": [
          {
            "unit": "I01.s6",
            "from": "t1",
            "to": "t4"
          }
        ],
        "lexicalRef": "catalog:I01.s6:e1"
      }
    },
    {
      "card": {
        "id": "flash:production:lesson01.lexical.preferred-name",
        "template": "production",
        "unit": "lexical:lesson01.lexical.preferred-name",
        "sourceRefs": [
          {
            "unit": "I01.s6",
            "from": "t1",
            "to": "t4"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.preferred-name\",\"practiceVersion\":1,\"template\":\"production\",\"target\":{\"document\":\"catalog\",\"unitId\":\"I01.s6\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t4\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"レン\"},{\"id\":\"t2\",\"text\":\"と\"},{\"id\":\"t3\",\"text\":\"呼んで\",\"reading\":\"よんで\",\"ruby\":[{\"text\":\"呼んで\",\"reading\":\"よんで\"}]},{\"id\":\"t4\",\"text\":\"ください\"}]}",
        "lexicalRef": "catalog:I01.s6:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.preferred-name",
        "tokens": [
          {
            "id": "t1",
            "text": "レン"
          },
          {
            "id": "t2",
            "text": "と"
          },
          {
            "id": "t3",
            "text": "呼んで",
            "reading": "よんで",
            "ruby": [
              {
                "text": "呼んで",
                "reading": "よんで"
              }
            ]
          },
          {
            "id": "t4",
            "text": "ください"
          }
        ],
        "meanings": {
          "zh-Hant": "請叫我レン",
          "en": "Please call me Ren",
          "ja": "レンという名前で呼んでほしいと頼んでいます"
        },
        "sourceRefs": [
          {
            "unit": "I01.s6",
            "from": "t1",
            "to": "t4"
          }
        ],
        "lexicalRef": "catalog:I01.s6:e1"
      }
    },
    {
      "card": {
        "id": "flash:listening:lesson01.lexical.preferred-name",
        "template": "listening",
        "unit": "lexical:lesson01.lexical.preferred-name",
        "sourceRefs": [
          {
            "unit": "I01.s6",
            "from": "t1",
            "to": "t4"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.preferred-name\",\"practiceVersion\":1,\"template\":\"listening\",\"target\":{\"document\":\"catalog\",\"unitId\":\"I01.s6\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t4\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"レン\"},{\"id\":\"t2\",\"text\":\"と\"},{\"id\":\"t3\",\"text\":\"呼んで\",\"reading\":\"よんで\",\"ruby\":[{\"text\":\"呼んで\",\"reading\":\"よんで\"}]},{\"id\":\"t4\",\"text\":\"ください\"}]}",
        "lexicalRef": "catalog:I01.s6:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.preferred-name",
        "tokens": [
          {
            "id": "t1",
            "text": "レン"
          },
          {
            "id": "t2",
            "text": "と"
          },
          {
            "id": "t3",
            "text": "呼んで",
            "reading": "よんで",
            "ruby": [
              {
                "text": "呼んで",
                "reading": "よんで"
              }
            ]
          },
          {
            "id": "t4",
            "text": "ください"
          }
        ],
        "meanings": {
          "zh-Hant": "請叫我レン",
          "en": "Please call me Ren",
          "ja": "レンという名前で呼んでほしいと頼んでいます"
        },
        "sourceRefs": [
          {
            "unit": "I01.s6",
            "from": "t1",
            "to": "t4"
          }
        ],
        "lexicalRef": "catalog:I01.s6:e1"
      }
    },
    {
      "card": {
        "id": "flash:recognition:lesson01.lexical.place-of-origin",
        "template": "recognition",
        "unit": "lexical:lesson01.lexical.place-of-origin",
        "sourceRefs": [
          {
            "unit": "I01.s7",
            "from": "t1",
            "to": "t3"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.place-of-origin\",\"practiceVersion\":1,\"template\":\"recognition\",\"target\":{\"document\":\"catalog\",\"unitId\":\"I01.s7\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t3\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"台湾\",\"reading\":\"たいわん\",\"ruby\":[{\"text\":\"台湾\",\"reading\":\"たいわん\"}]},{\"id\":\"t2\",\"text\":\"から\"},{\"id\":\"t3\",\"text\":\"来ました\",\"reading\":\"きました\",\"ruby\":[{\"text\":\"来ました\",\"reading\":\"きました\"}]}]}",
        "lexicalRef": "catalog:I01.s7:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.place-of-origin",
        "tokens": [
          {
            "id": "t1",
            "text": "台湾",
            "reading": "たいわん",
            "ruby": [
              {
                "text": "台湾",
                "reading": "たいわん"
              }
            ]
          },
          {
            "id": "t2",
            "text": "から"
          },
          {
            "id": "t3",
            "text": "来ました",
            "reading": "きました",
            "ruby": [
              {
                "text": "来ました",
                "reading": "きました"
              }
            ]
          }
        ],
        "meanings": {
          "zh-Hant": "我來自台灣",
          "en": "I’m from Taiwan",
          "ja": "台湾から来たと伝えています"
        },
        "sourceRefs": [
          {
            "unit": "I01.s7",
            "from": "t1",
            "to": "t3"
          }
        ],
        "lexicalRef": "catalog:I01.s7:e1"
      }
    },
    {
      "card": {
        "id": "flash:production:lesson01.lexical.place-of-origin",
        "template": "production",
        "unit": "lexical:lesson01.lexical.place-of-origin",
        "sourceRefs": [
          {
            "unit": "I01.s7",
            "from": "t1",
            "to": "t3"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.place-of-origin\",\"practiceVersion\":1,\"template\":\"production\",\"target\":{\"document\":\"catalog\",\"unitId\":\"I01.s7\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t3\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"台湾\",\"reading\":\"たいわん\",\"ruby\":[{\"text\":\"台湾\",\"reading\":\"たいわん\"}]},{\"id\":\"t2\",\"text\":\"から\"},{\"id\":\"t3\",\"text\":\"来ました\",\"reading\":\"きました\",\"ruby\":[{\"text\":\"来ました\",\"reading\":\"きました\"}]}]}",
        "lexicalRef": "catalog:I01.s7:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.place-of-origin",
        "tokens": [
          {
            "id": "t1",
            "text": "台湾",
            "reading": "たいわん",
            "ruby": [
              {
                "text": "台湾",
                "reading": "たいわん"
              }
            ]
          },
          {
            "id": "t2",
            "text": "から"
          },
          {
            "id": "t3",
            "text": "来ました",
            "reading": "きました",
            "ruby": [
              {
                "text": "来ました",
                "reading": "きました"
              }
            ]
          }
        ],
        "meanings": {
          "zh-Hant": "我來自台灣",
          "en": "I’m from Taiwan",
          "ja": "台湾から来たと伝えています"
        },
        "sourceRefs": [
          {
            "unit": "I01.s7",
            "from": "t1",
            "to": "t3"
          }
        ],
        "lexicalRef": "catalog:I01.s7:e1"
      }
    },
    {
      "card": {
        "id": "flash:listening:lesson01.lexical.place-of-origin",
        "template": "listening",
        "unit": "lexical:lesson01.lexical.place-of-origin",
        "sourceRefs": [
          {
            "unit": "I01.s7",
            "from": "t1",
            "to": "t3"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.place-of-origin\",\"practiceVersion\":1,\"template\":\"listening\",\"target\":{\"document\":\"catalog\",\"unitId\":\"I01.s7\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t3\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"台湾\",\"reading\":\"たいわん\",\"ruby\":[{\"text\":\"台湾\",\"reading\":\"たいわん\"}]},{\"id\":\"t2\",\"text\":\"から\"},{\"id\":\"t3\",\"text\":\"来ました\",\"reading\":\"きました\",\"ruby\":[{\"text\":\"来ました\",\"reading\":\"きました\"}]}]}",
        "lexicalRef": "catalog:I01.s7:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.place-of-origin",
        "tokens": [
          {
            "id": "t1",
            "text": "台湾",
            "reading": "たいわん",
            "ruby": [
              {
                "text": "台湾",
                "reading": "たいわん"
              }
            ]
          },
          {
            "id": "t2",
            "text": "から"
          },
          {
            "id": "t3",
            "text": "来ました",
            "reading": "きました",
            "ruby": [
              {
                "text": "来ました",
                "reading": "きました"
              }
            ]
          }
        ],
        "meanings": {
          "zh-Hant": "我來自台灣",
          "en": "I’m from Taiwan",
          "ja": "台湾から来たと伝えています"
        },
        "sourceRefs": [
          {
            "unit": "I01.s7",
            "from": "t1",
            "to": "t3"
          }
        ],
        "lexicalRef": "catalog:I01.s7:e1"
      }
    },
    {
      "card": {
        "id": "flash:recognition:lesson01.lexical.pleasure-at-meeting",
        "template": "recognition",
        "unit": "lexical:lesson01.lexical.pleasure-at-meeting",
        "sourceRefs": [
          {
            "unit": "T05.s2",
            "from": "t1",
            "to": "t5"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.pleasure-at-meeting\",\"practiceVersion\":1,\"template\":\"recognition\",\"target\":{\"document\":\"catalog\",\"unitId\":\"T05.s2\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t5\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"お\"},{\"id\":\"t2\",\"text\":\"会い\",\"reading\":\"あい\",\"ruby\":[{\"text\":\"会い\",\"reading\":\"あい\"}]},{\"id\":\"t3\",\"text\":\"できて\"},{\"id\":\"t4\",\"text\":\"うれしい\"},{\"id\":\"t5\",\"text\":\"です\"}]}",
        "lexicalRef": "catalog:T05.s2:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.pleasure-at-meeting",
        "tokens": [
          {
            "id": "t1",
            "text": "お"
          },
          {
            "id": "t2",
            "text": "会い",
            "reading": "あい",
            "ruby": [
              {
                "text": "会い",
                "reading": "あい"
              }
            ]
          },
          {
            "id": "t3",
            "text": "できて"
          },
          {
            "id": "t4",
            "text": "うれしい"
          },
          {
            "id": "t5",
            "text": "です"
          }
        ],
        "meanings": {
          "zh-Hant": "很高興能見到你",
          "en": "I’m pleased to meet you",
          "ja": "会えたことをうれしく思っています"
        },
        "sourceRefs": [
          {
            "unit": "T05.s2",
            "from": "t1",
            "to": "t5"
          }
        ],
        "lexicalRef": "catalog:T05.s2:e1"
      }
    },
    {
      "card": {
        "id": "flash:production:lesson01.lexical.pleasure-at-meeting",
        "template": "production",
        "unit": "lexical:lesson01.lexical.pleasure-at-meeting",
        "sourceRefs": [
          {
            "unit": "T05.s2",
            "from": "t1",
            "to": "t5"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.pleasure-at-meeting\",\"practiceVersion\":1,\"template\":\"production\",\"target\":{\"document\":\"catalog\",\"unitId\":\"T05.s2\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t5\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"お\"},{\"id\":\"t2\",\"text\":\"会い\",\"reading\":\"あい\",\"ruby\":[{\"text\":\"会い\",\"reading\":\"あい\"}]},{\"id\":\"t3\",\"text\":\"できて\"},{\"id\":\"t4\",\"text\":\"うれしい\"},{\"id\":\"t5\",\"text\":\"です\"}]}",
        "lexicalRef": "catalog:T05.s2:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.pleasure-at-meeting",
        "tokens": [
          {
            "id": "t1",
            "text": "お"
          },
          {
            "id": "t2",
            "text": "会い",
            "reading": "あい",
            "ruby": [
              {
                "text": "会い",
                "reading": "あい"
              }
            ]
          },
          {
            "id": "t3",
            "text": "できて"
          },
          {
            "id": "t4",
            "text": "うれしい"
          },
          {
            "id": "t5",
            "text": "です"
          }
        ],
        "meanings": {
          "zh-Hant": "很高興能見到你",
          "en": "I’m pleased to meet you",
          "ja": "会えたことをうれしく思っています"
        },
        "sourceRefs": [
          {
            "unit": "T05.s2",
            "from": "t1",
            "to": "t5"
          }
        ],
        "lexicalRef": "catalog:T05.s2:e1"
      }
    },
    {
      "card": {
        "id": "flash:listening:lesson01.lexical.pleasure-at-meeting",
        "template": "listening",
        "unit": "lexical:lesson01.lexical.pleasure-at-meeting",
        "sourceRefs": [
          {
            "unit": "T05.s2",
            "from": "t1",
            "to": "t5"
          }
        ],
        "signature": "{\"practiceKey\":\"lesson01.lexical.pleasure-at-meeting\",\"practiceVersion\":1,\"template\":\"listening\",\"target\":{\"document\":\"catalog\",\"unitId\":\"T05.s2\",\"spanId\":\"e1\",\"fromTokenId\":\"t1\",\"toTokenId\":\"t5\"},\"tokens\":[{\"id\":\"t1\",\"text\":\"お\"},{\"id\":\"t2\",\"text\":\"会い\",\"reading\":\"あい\",\"ruby\":[{\"text\":\"会い\",\"reading\":\"あい\"}]},{\"id\":\"t3\",\"text\":\"できて\"},{\"id\":\"t4\",\"text\":\"うれしい\"},{\"id\":\"t5\",\"text\":\"です\"}]}",
        "lexicalRef": "catalog:T05.s2:e1"
      },
      "visibleFacts": {
        "unit": "lexical:lesson01.lexical.pleasure-at-meeting",
        "tokens": [
          {
            "id": "t1",
            "text": "お"
          },
          {
            "id": "t2",
            "text": "会い",
            "reading": "あい",
            "ruby": [
              {
                "text": "会い",
                "reading": "あい"
              }
            ]
          },
          {
            "id": "t3",
            "text": "できて"
          },
          {
            "id": "t4",
            "text": "うれしい"
          },
          {
            "id": "t5",
            "text": "です"
          }
        ],
        "meanings": {
          "zh-Hant": "很高興能見到你",
          "en": "I’m pleased to meet you",
          "ja": "会えたことをうれしく思っています"
        },
        "sourceRefs": [
          {
            "unit": "T05.s2",
            "from": "t1",
            "to": "t5"
          }
        ],
        "lexicalRef": "catalog:T05.s2:e1"
      }
    }
  ]
});
