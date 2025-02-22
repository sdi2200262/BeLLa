import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const LicensePage = () => {
  const [licenseText, setLicenseText] = useState<string>('');

  useEffect(() => {
    // Fetch the LICENSE file content
    fetch('/LICENSE')
      .then((response) => response.text())
      .then((text) => setLicenseText(text))
      .catch((error) => console.error('Error loading LICENSE:', error));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Terms of Service & License</h1>
          <div className="flex items-center gap-1 text-sm text-white/60">
            Using BeLLa <Scale className="h-3 w-3" /> License Agreement
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10">
            <TabsTrigger value="terms" className="data-[state=active]:bg-white/10">
              Terms of Service
            </TabsTrigger>
            <TabsTrigger value="license" className="data-[state=active]:bg-white/10">
              License
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="mt-6">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className='text-white text-2xl font-bold'>Terms of Service</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert">
                <p className='text-white text-xl font-bold mt-6'>1. Acceptance of Terms</p>
                <p className='text-white mt-4 ml-4'>
                  Welcome to BeLLa. By accessing and using this software, you acknowledge 
                  that you have read, understood, and agree to be bound by these terms of service.
                </p>

                <p className='text-white text-xl font-bold mt-6'>2. Use License</p>
                <p className='text-white mt-4 ml-4'>
                  This software is distributed under the GNU General Public License (GPL) v3, which ensures 
                  software freedom through the following rights and obligations:
                </p>

                <ul className="text-white mt-4 space-y-2 ml-4">
                  <li>✓ Freedom to use the software for any purpose</li>
                  <li>✓ Freedom to study and modify the source code</li>
                  <li>✓ Freedom to share the software</li>
                  <li>✓ Freedom to share your modifications</li>
                </ul>

                <p className='text-white text-xl font-bold mt-6'>3. Key Requirements</p>
                <p className='text-white mt-4 ml-4'>
                  The GPL License has specific requirements to protect user freedom:
                </p>
                <ul className="text-white space-y-2 mt-4 ml-4">
                  <li>• Any modified version must also be distributed under GPL v3</li>
                  <li>• The complete source code must be made available when distributing the software</li>
                  <li>• All changes made to the source code must be clearly documented</li>
                  <li>• The original copyright and license notices must be preserved</li>
                  <li>• Clear notices must be provided stating the use of GPL v3 and its terms</li>
                </ul>

                <p className='text-white text-xl font-bold mt-6'>4. Copyleft Protection</p>
                <p className='text-white mt-4 ml-4'>
                  This software is protected by copyleft, which means:
                </p>
                <ul className="text-white space-y-2 mt-4 ml-4">
                  <li>• All derivative works must also be open-source</li>
                  <li>• Modified versions cannot impose additional restrictions</li>
                  <li>• Integration with proprietary software is restricted</li>
                </ul>

                <p className='text-white text-xl font-bold mt-6'>5. Disclaimer of Warranty</p>
                <p className='text-white mt-4 ml-4'>
                  Please note that this software is provided "as is." While we strive for excellence, we cannot guarantee:
                </p>
                <ul className="text-white space-y-2 mt-4 ml-4">
                  <li>• Fitness for any particular purpose</li>
                  <li>• Uninterrupted or error-free operation</li>
                  <li>• The correction of all software defects</li>
                </ul>
                <p className='text-white mt-4 ml-4'>
                  The authors and copyright holders shall not be liable for any claims, damages, or other 
                  liabilities arising from the software's use or distribution.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="license" className="mt-6">
            <Card className='bg-black/40 border-white/10'>
              <CardHeader>
                <CardTitle className='text-white text-2xl font-bold'>GNU General Public License</CardTitle>
              </CardHeader>
              <CardContent className='prose dark:prose-invert'>
                <pre className="whitespace-pre-wrap text-white p-4 rounded-lg text-sm text-left">
                  {licenseText || 'Loading license...'}
                </pre>
                <div className='flex justify-center mt-4'>
                  <img src="/svg/BeLLa/CobuterMan.svg" alt="Cobuter Man" className="h-14" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LicensePage;
