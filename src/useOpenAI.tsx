import useData from './useData';

interface OpenAIResponse {
  text: string;
}

interface OpenAIHookResponse {
  openAIResponse?: string;
  openAILoading: boolean;
  openAIError: Error | null;
}

const useOpenAI = (model: string, prompt: string): OpenAIHookResponse => {
  // const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const {
    data,
    error: openAIError,
    loading: openAILoading,
  } = useData<OpenAIResponse>({
    url: 'https://api.openai.com/v1/',
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${'apiKey'}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        temperature: 0.5,
      }),
    },
    expiration: 60 * 24,
  });

  return { openAIResponse: data?.text, openAILoading, openAIError };
};

export default useOpenAI;
