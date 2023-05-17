export const getAPIAuthToken = async () => {
    // request oauth token from auth0
    // return token
    const body = {
        client_id: import.meta.env.VITE_AUTH0_CLIENT_ID,
        client_secret: import.meta.env.VITE_AUTH0_CLIENT_SECRET,
        audience: import.meta.env.VITE_API_ENDPOINT,
        grant_type: "client_credentials",
    };

    const response = await fetch(import.meta.env.VITE_AUTH0_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        mode: "cors",
    });

    const { access_token, expires_in } = await response.json();

    return {
        access_token,
        expires_in,
    };
};

export const getS3AccessUrl = async (access_token: string) => {
    const response = await fetch(
        `${import.meta.env.VITE_API_ENDPOINT}access-url`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: access_token,
            },
            mode: "cors",
        }
    );
    return response.json();
};

export const uploadFileToS3 = async (file: Blob, access_token: string) => {
    // first get signed url from api
    const { uploadURL } = await getS3AccessUrl(access_token);
    const response = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        mode: "cors",
    });
    return response;
};
