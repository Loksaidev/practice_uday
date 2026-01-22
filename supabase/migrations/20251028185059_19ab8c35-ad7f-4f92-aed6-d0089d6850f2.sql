-- Add option for organizations to use Knowsy topics
ALTER TABLE organizations 
ADD COLUMN use_knowsy_topics boolean DEFAULT true;

COMMENT ON COLUMN organizations.use_knowsy_topics IS 'Allow players to use Knowsy default topics in addition to custom topics';