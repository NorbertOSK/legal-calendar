export interface ApiErrorDetail {
  msgCode: string
  message: string
}

export interface ApiEnvelope<T> {
  ok: true
  data: T
}

export interface ApiErrorResponse {
  ok: false
  errors: ApiErrorDetail[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
