const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_SECURITY_CONFIG_FILE = 'network_security_config.xml';

function withNetworkSecurityConfig(config) {
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      const sourceXml = path.join(config.modRequest.platformProjectRoot, '..', 'assets', 'xml', NETWORK_SECURITY_CONFIG_FILE);
      const destXml = path.join(xmlDir, NETWORK_SECURITY_CONFIG_FILE);

      if (fs.existsSync(sourceXml)) {
        fs.copyFileSync(sourceXml, destXml);
      }

      return config;
    },
  ]);

  config = withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return config;
  });

  return config;
}

module.exports = withNetworkSecurityConfig;
