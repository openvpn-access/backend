type Props = {
    username: string;
    host: string;
    link: string;
}

// TODO: Currently github is abused and used as CDN for the logo, fix that (how?)
// TODO: Swith to EJS and minify it too?

export const verifyEmailTemplate = (props: Props): string => `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv=Content-Type content="text/html; charset=utf-8">
    <meta name=Generator content="Microsoft Word 15 (filtered medium)">
    <!--[if !mso]>
    <style>v: * {
        behavior: url(#default#VML);
    }

    o: * {
        behavior: url(#default#VML);
    }

    w: * {
        behavior: url(#default#VML);
    }

    .shape {
        behavior: url(#default#VML);
    }
    </style><![endif]-->
    <style><!--
    /* Font Definitions */
    @font-face {
        font-family: Helvetica;
        panose-1: 2 11 6 4 2 2 2 2 2 4;
    }

    @font-face {
        font-family: "Cambria Math";
        panose-1: 2 4 5 3 5 4 6 3 2 4;
    }

    @font-face {
        font-family: Calibri;
        panose-1: 2 15 5 2 2 2 4 3 2 4;
    }

    @font-face {
        font-family: Consolas;
        panose-1: 2 11 6 9 2 2 4 3 2 4;
    }

    /* Style Definitions */
    p.MsoNormal, li.MsoNormal, div.MsoNormal {
        margin: 0cm;
        margin-bottom: .0001pt;
        font-size: 11.0pt;
        font-family: "Calibri", sans-serif;
        mso-fareast-language: EN-US;
    }

    a:link, span.MsoHyperlink {
        mso-style-priority: 99;
        color: #0563c1;
        text-decoration: underline;
    }

    p.MsoPlainText, li.MsoPlainText, div.MsoPlainText {
        mso-style-priority: 99;
        mso-style-link: "Plain Text Char";
        margin: 0cm;
        margin-bottom: .0001pt;
        font-size: 11.0pt;
        font-family: "Calibri", sans-serif;
        mso-fareast-language: EN-US;
    }

    span.PlainTextChar {
        mso-style-name: "Plain Text Char";
        mso-style-priority: 99;
        mso-style-link: "Plain Text";
        font-family: Consolas;
        mso-fareast-language: EN-US;
    }

    span.EmailStyle21 {
        mso-style-type: personal-compose;
        font-family: "Calibri", sans-serif;
        color: windowtext;
    }

    .MsoChpDefault {
        mso-style-type: export-only;
        font-size: 10.0pt;
    }

    @page WordSection1 {
        size: 612.0pt 792.0pt;
        margin: 72.0pt 72.0pt 72.0pt 72.0pt;
    }

    div.WordSection1 {
        page: WordSection1;
    }

    --></style>
    <!--[if gte mso 9]>
    <xml>
        <o:shapedefaults v:ext="edit" spidmax="1026"/>
    </xml><![endif]--><!--[if gte mso 9]>
    <xml>
        <o:shapelayout v:ext="edit">
            <o:idmap v:ext="edit" data="1"/>
        </o:shapelayout>
    </xml><![endif]--></head>
<body lang=en-DE link="#0563C1" vlink="#954F72">
<div class=WordSection1>
    <div align=center>
        <table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width=529 style='border-collapse:collapse'>
            <tr style='height:161.75pt'>
                <td width=529 valign=top style='width:14.0cm;padding:0cm 5.4pt 0cm 5.4pt;height:161.75pt'>
                    <p class=MsoPlainText align=center style='text-align:center'><span lang=EN-US style='font-family:"Helvetica",sans-serif'><img width=156
                                                                                                                                                  height=125
                                                                                                                                                  style='width:1.623in;height:1.3in'
                                                                                                                                                  id="_x0000_i1105"
                                                                                                                                                  src="https://user-images.githubusercontent.com/30767528/88220103-d758be00-cc62-11ea-9dd7-f1fedc478d3a.png"><o:p></o:p></span>
                    </p>
                </td>
            </tr>
            <tr style='height:19.55pt'>
                <td width=529 valign=top style='width:14.0cm;padding:0cm 5.4pt 0cm 5.4pt;height:19.55pt'>
                    <p class=MsoPlainText><span lang=EN-US style='font-family:"Helvetica",sans-serif;color:#333f50'>Hey ${props.username},<o:p></o:p></span></p>
                </td>
            </tr>
            <tr style='height:100.5pt'>
                <td width=529 valign=top style='width:14.0cm;padding:0cm 5.4pt 0cm 5.4pt;height:100.5pt'>
                    <p class=MsoPlainText style='line-height:17.0pt;mso-line-height-rule:exactly'><span lang=EN-US
                                                                                                        style='font-size:10.0pt;font-family:"Helvetica",sans-serif;color:#44546a'>An administrator created an account on ${props.host} for you!</span><span
                        lang=EN-US> </span><span lang=EN-US style='font-size:10.0pt;font-family:"Helvetica",sans-serif;color:#44546a'><o:p></o:p></span></p>
                    <p class=MsoPlainText style='line-height:17.0pt;mso-line-height-rule:exactly'><span lang=EN-US
                                                                                                        style='font-size:10.0pt;font-family:"Helvetica",sans-serif;color:#44546a'>Before you get started, we just need to confirm that this email belongs to you. This way you’ll also be able to reset your password in case you forget it.</span><span
                        lang=EN-US> </span><span lang=EN-US style='font-size:10.0pt;font-family:"Helvetica",sans-serif;color:#44546a'><o:p></o:p></span></p>
                    <p class=MsoPlainText style='line-height:17.0pt;mso-line-height-rule:exactly'><span lang=EN-US
                                                                                                        style='font-size:10.0pt;font-family:"Helvetica",sans-serif;color:#44546a'>Click below to verify your email:</span><span
                        lang=EN-US> </span><span lang=EN-US style='font-size:10.0pt;font-family:"Helvetica",sans-serif;color:#44546a'><o:p></o:p></span></p>
                </td>
            </tr>
            <tr style='height:85.65pt'>
                <td width=529 valign=top style='width:14.0cm;padding:0cm 5.4pt 0cm 5.4pt;height:85.65pt'>
                    <div align=center>
                        <table class=MsoTableGrid border=1 cellspacing=0 cellpadding=0 style='border-collapse:collapse;border:none'>
                            <tr style='height:31.75pt'>
                                <td width=116 style='width:86.65pt;border:none;background:#2597ff;padding:0cm 5.4pt 0cm 5.4pt;height:31.75pt'>
                                    <p class=MsoNormal align=center style='text-align:center'><span lang=EN-US
                                                                                                    style='font-size:10.0pt;font-family:"Helvetica",sans-serif;color:white'><a
                                        href="${props.link}"><span style='color:white;text-decoration:none'>Verify Email</span></a><o:p></o:p></span></p>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <p class=MsoNormal align=center style='text-align:center'><span lang=EN-US
                                                                                    style='font-size:10.0pt;font-family:"Helvetica",sans-serif;color:white'><o:p></o:p></span>
                    </p>
                </td>
            </tr>
            <tr style='height:13.8pt'>
                <td width=529 valign=top style='width:14.0cm;padding:0cm 5.4pt 0cm 5.4pt;height:13.8pt'>
                    <p class=MsoPlainText align=center style='text-align:center'><span lang=EN-US
                                                                                       style='font-size:9.0pt;font-family:"Helvetica",sans-serif;color:#44546a'>Need help? Contact the administrator of ${props.host}.</span><span
                        lang=EN-US style='font-family:"Helvetica",sans-serif;color:#44546a'><o:p></o:p></span></p>
                </td>
            </tr>
            <tr style='height:20.85pt'>
                <td width=529 valign=top style='width:14.0cm;padding:0cm 5.4pt 0cm 5.4pt;height:20.85pt'>
                    <p class=MsoPlainText align=center style='text-align:center'><span lang=EN-US
                                                                                       style='font-size:9.0pt;font-family:"Helvetica",sans-serif;color:#99aab5'>Sent by ${props.host} • </span><span
                        lang=EN-US style='font-size:9.0pt;font-family:"Helvetica",sans-serif;color:#2597ff'><a
                        href="https://github.com/openvpn-access/dashboard"><span style='color:#2597ff;text-decoration:none'>GitHub</span></a> </span><span
                        lang=EN-US style='font-size:9.0pt;font-family:"Helvetica",sans-serif;color:#99aab5'>• Open Source</span><span lang=EN-US
                                                                                                                                      style='font-size:9.0pt;font-family:"Helvetica",sans-serif;color:#44546a'><o:p></o:p></span>
                    </p>
                </td>
            </tr>
        </table>
    </div>
    <p class=MsoPlainText><span lang=EN-US style='font-family:"Helvetica",sans-serif'><o:p>&nbsp;</o:p></span></p>
</div>
</body>
</html>
`;
