// Test script to verify resource dependency parsing

const testReport = `## 8. RESOURCE DEPENDENCIES

RESOURCE_DEPENDENCIES:
[{"id":"s3-1","name":"Primary S3 Bucket","type":"s3","dependencies":[]},{"id":"cf-1","name":"CloudFront Distribution","type":"cloudfront","dependencies":["s3-1"]},{"id":"lambda-1","name":"Image Processing Function","type":"lambda","dependencies":["s3-1"]},{"id":"s3-2","name":"Replica S3 Bucket","type":"s3","dependencies":["s3-1"]},{"id":"kms-1","name":"KMS Key","type":"kms","dependencies":[]},{"id":"iam-1","name":"Partner IAM Roles","type":"iam","dependencies":["kms-1","s3-1"]}]`;

function parseResourceDependencies(report) {
  console.log('Parsing resource dependencies from report...');

  try {
    const sectionMatch = report.match(/RESOURCE_DEPENDENCIES:\s*([\s\S]*?)(?=\n\s*##|$)/);

    if (sectionMatch) {
      const sectionText = sectionMatch[1].trim();
      console.log('Found RESOURCE_DEPENDENCIES section');
      console.log('Section text (first 300 chars):', sectionText.substring(0, 300));

      const jsonMatch = sectionText.match(/\[([\s\S]*)\]/);

      if (jsonMatch) {
        let jsonStr = '[' + jsonMatch[1] + ']';
        console.log('\nRaw JSON string (first 300 chars):', jsonStr.substring(0, 300));

        jsonStr = jsonStr.replace(/\s+/g, ' ').trim();
        console.log('\nCleaned JSON string (first 300 chars):', jsonStr.substring(0, 300));

        try {
          const resources = JSON.parse(jsonStr);

          if (Array.isArray(resources)) {
            const validResources = resources.filter(r =>
              r.id && r.name && r.type && Array.isArray(r.dependencies)
            );

            console.log(`\n✅ Parsed ${validResources.length} valid resources:`);
            validResources.forEach(r => {
              console.log(`  - ${r.id}: ${r.name} (${r.type}) -> depends on: [${r.dependencies.join(', ')}]`);
            });
            return validResources;
          }
        } catch (jsonError) {
          console.error('❌ Failed to parse JSON:', jsonError.message);
          console.error('JSON string:', jsonStr);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  return [];
}

console.log('Testing resource dependency parsing...\n');
const result = parseResourceDependencies(testReport);
console.log('\n=== RESULT ===');
console.log('Parsed resources:', result.length);
console.log(JSON.stringify(result, null, 2));
