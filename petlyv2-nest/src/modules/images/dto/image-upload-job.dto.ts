/**
 * Payload enfileirado no BullMQ para upload assíncrono de imagens.
 *
 * O buffer do arquivo é serializado para Base64 antes de entrar na fila,
 * pois o BullMQ serializa os dados como JSON e Buffers não são suportados
 * nativamente nesse formato.
 */
export interface ImageUploadJobDto {
  /** 'user' para avatar de usuário, 'pet' para avatar de pet */
  entityType: 'user' | 'pet';

  /** _id do documento a ser atualizado após o upload */
  entityId: string;

  /**
   * ID do usuário dono do pet — necessário apenas quando entityType === 'pet'
   * para invalidar o cache `user-pets:<userId>` depois do upload.
   */
  ownerId?: string;

  /** Conteúdo do arquivo codificado em Base64 */
  fileBuffer: string;

  /** MIME type original do arquivo (ex: 'image/jpeg') */
  mimetype: string;

  /** Nome original do arquivo, usado para gerar o public_id no Cloudinary */
  originalname: string;
}