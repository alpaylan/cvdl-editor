// Fetch data from the server and route to home page

import { redirect } from "next/navigation";

const getServersideProps = async (context) => {
    const { username } = context.params;
    return {
        props: {
            username
        }
    }
}

export default async function UserPage({ username }) {
    redirect(`/?user=${username}`);
}


