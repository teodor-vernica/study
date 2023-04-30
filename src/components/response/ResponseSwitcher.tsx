import { Box } from '@mantine/core';
import { TrialResult } from '../../store/types';
import CheckBoxInput from './CheckBoxInput';
import DropdownInput from './DropdownInput';
import LikertInput from './LikertInput';
import NumericInput from './NumericInput';
import RadioInput from './RadioInput';
import SliderInput from './SliderInput';
import TextAreaInput from './TextAreaInput';
import { Response } from '../../parser/types';
import StringInput from './StringInput';
import IframeInput from './IframeInput';

export type arrayObj = {
    value: Array<string>,
}

type Props = {
  response: Response;
  status?: TrialResult;
  answer:  arrayObj;
};

export default function ResponseSwitcher({ response, answer }: Props) {
  const { type, desc, prompt, options, required, preset, max, min } = response;

  if (!type) return null;

  return (
    <>
      <Box sx={{margin:10, padding:5}}>
        {type === 'shortText' && (
            <StringInput placeholder={desc} label={prompt} required={required} answer={answer}/>
        )}
        {type === 'dropdown' && (
            <DropdownInput
                title={prompt}
                placeholder={desc}
                dropdownData={options}
                answer={answer}
                required={required}
            />
        )}
        {type === 'radio' && (
            <RadioInput title={prompt} desc={desc} radioData={options}answer={answer} required={required}/>
        )}
        {type === 'numerical' && (
            <NumericInput label={prompt} placeholder={desc} required={required} answer={answer} max={max as number} min={min as number}/>
        )}
        {type === 'likert' && (
            <LikertInput title={prompt} desc={desc} likertPreset={preset as string} answer={answer} required={required}/>
        )}
        {type === 'checkbox' && (
            <CheckBoxInput label={prompt} desc={desc} required={required} checkboxData={options} answer={answer}/>
        )}
        {type === 'longText' && (
            <TextAreaInput placeholder={desc} label={prompt} required={required} answer={answer}/>
        )}
        {type === 'slider' && <SliderInput title={prompt} desc={desc} sliderData={options} answer={answer} required={required}/>}
        {type === 'iframe' && <IframeInput title={prompt} desc={desc} answer={answer.value} required={required}/>}

      </Box>
    </>
  );
}