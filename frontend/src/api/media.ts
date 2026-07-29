import { api } from "@/api/axios"

/**
 * Upload an image file (multipart/form-data, field "file"); returns its URL.
 *
 * @param file the image file to upload
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await api.post<{ url: string }>("/media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return data
}
