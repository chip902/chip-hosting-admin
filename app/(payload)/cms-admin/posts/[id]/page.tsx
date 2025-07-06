import PostEditor from './PostEditor'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function PostEditorPage({ params }: Props) {
  const resolvedParams = await params
  return <PostEditor postId={resolvedParams.id} />
}