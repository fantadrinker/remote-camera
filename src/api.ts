export const getS3AccessUrl = async (access_token: string, sub: string) => {
  const response = await fetch(
    `${import.meta.env.VITE_AWS_API_ENDPOINT}access-url?sub=${sub}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: access_token,
      },
      mode: 'cors',
    }
  )
  return response.json()
}

export const getS3DownloadUrl = async (
  access_token: string,
  sub: string,
  key: string,
) => {
  const response = await fetch(
    `${
      import.meta.env.VITE_AWS_API_ENDPOINT
    }download-url?sub=${sub}&fileID=${key}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: access_token,
      },
      mode: 'cors',
    }
  )
  const { url } = await response.json()
  return url
}

export const uploadFileToS3 = async (
  file: Blob,
  access_token: string,
  sub: string
) => {
  // first get signed url from api
  const { uploadUrl } = await getS3AccessUrl(access_token, sub)
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    mode: 'cors',
  })
  return response
}

interface RecordingAPIResponse {
  Key: string
  LastModified: string
  Size: number
}

export const getRecordings = async (access_token: string, sub: string) => {
  const response = await fetch(
    `${import.meta.env.VITE_AWS_API_ENDPOINT}recordings?sub=${sub}&limit=10`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: access_token,
      },
      mode: 'cors',
    }
  )
  const {data} = await response.json()
  return data?.map((recording: RecordingAPIResponse) => {
    return {
      Key: recording.Key,
      LastModified: new Date(recording.LastModified),
      Size: recording.Size,
    }
  })
}

