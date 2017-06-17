const checkStatus = response => (response.ok ? response : Promise.reject(response.statusText));
const parseJson = response => response.json();
export const getTranscript = url => fetch(url).then(checkStatus).then(parseJson);

export default getTranscript;
