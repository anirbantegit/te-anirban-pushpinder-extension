//// API REQUEST TYPES
export interface IPayloadVideo {
  uuid: string;
  timestamp: number;
  title: string;
  thumbnail_url: string;
  channel_name: string;
  channel_id: string;
  channel_url: string;
}

export interface IAPIPayload {
  videos?: IPayloadVideo[];
}

export interface IBlockListPayload extends IAPIPayload {
  block_list: string[];
  allow_list?: never;
}

export interface IAllowListPayload extends IAPIPayload {
  allow_list: string[];
  block_list?: never;
}
export type IAPIPayloadEither = IBlockListPayload | IAllowListPayload;



//// API RESPONSE TYPES
export interface IAPIVideoResponse {
  uuid: string;
  video_title: string;
  blocked: boolean;
}

export type IAPIResponse = IAPIVideoResponse[];