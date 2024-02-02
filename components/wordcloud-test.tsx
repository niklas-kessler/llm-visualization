import { Text } from '@visx/text';
import { scaleLog } from '@visx/scale';
import Wordcloud from '@visx/wordcloud/lib/Wordcloud';
import { totoAfricaLyrics } from './text';
import { Keyword } from '@/app/utils/types';

interface ExampleProps {
  width: number;
  height: number;
  keywords: string[];
}

export default function WordcloudTest({ width, height, keywords }: ExampleProps) {
  
    const colors = ['#143059', '#2F6B9A', '#82a6c2'];

    function wordFreq(): Keyword[] {
        const freqMap: Record<string, number> = {};

        for (const w of keywords) {
            if (!freqMap[w]) freqMap[w] = 0;
            freqMap[w] += 1;
        }
        return Object.keys(freqMap).map((word) => ({ text: word, value: freqMap[word] }));
    }
    const words = wordFreq();

    const fontScale = scaleLog({
    domain: [Math.min(...words.map((w) => w.value)), Math.max(...words.map((w) => w.value))],
    range: [10,12],
    });
    const fontSizeSetter = (datum: Keyword) => fontScale(datum.value);

    const fixedValueGenerator = () => 0.5;
      
    return (
    <svg>
        <g>
            <Wordcloud
                words={words}
                width={width}
                height={height}
                fontSize={fontSizeSetter}
                font={'Impact'}
                padding={2}
                spiral={'rectangular'}
                rotate={0}
                random={fixedValueGenerator}
            >
                {(cloudWords) =>
                cloudWords.map((w, i) => (
                    <Text
                    key={w.text}
                    fill={colors[i % colors.length]}
                    textAnchor={'middle'}
                    transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
                    fontSize={w.size}
                    fontFamily={w.font}
                    >
                    {w.text}
                    </Text>
                ))
                }
            </Wordcloud>
        </g>
    </svg>
  );
}