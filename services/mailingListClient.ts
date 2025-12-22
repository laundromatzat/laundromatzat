interface SubscribeResponse {
  id: string;
  email: string;
  name?: string;
  subscribedAt: string;
}

export async function subscribeToMailingList(input: { email: string; name?: string }): Promise<SubscribeResponse> {
  console.log('Mailing list subscription mocked:', input);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    id: 'mock-id',
    email: input.email,
    name: input.name,
    subscribedAt: new Date().toISOString(),
  };
}
