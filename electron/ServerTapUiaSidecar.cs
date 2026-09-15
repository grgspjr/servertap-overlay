using System;
using System.Diagnostics;
using System.Threading;
using System.Windows.Automation;
using System.Windows.Forms;

namespace ServerTap
{
    class UiaAutoFill
    {
        [STAThread]
        static void Main(string[] args)
        {
            if (args.Length < 3) return;

            string targetUrl = args[0];
            string username = args[1];
            string password = args[2];

            bool isHris = targetUrl.ToLower().Contains("hris");
            bool isFlutter = targetUrl.ToLower().Contains("ess");

            // Allow ExtJS / HRIS an initial settlement delay so Ext.Viewport finishes mounting
            if (isHris)
            {
                Thread.Sleep(800);
            }

            // Poll up to 35 attempts (14 seconds total) for Edge window and Web Document
            for (int attempt = 0; attempt < 35; attempt++)
            {
                Thread.Sleep(350);

                try
                {
                    AutomationElement root = AutomationElement.RootElement;
                    Condition winCond = new OrCondition(
                        new PropertyCondition(AutomationElement.ClassNameProperty, "Chrome_WidgetWin_1"),
                        new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Window)
                    );

                    AutomationElementCollection windows = root.FindAll(TreeScope.Children, winCond);

                    foreach (AutomationElement win in windows)
                    {
                        int pid = win.Current.ProcessId;
                        Process p = Process.GetProcessById(pid);
                        if (p != null && p.ProcessName.ToLower().Contains("edge"))
                        {
                            // Target Web Page Document ONLY (filters out Edge Address Bar)
                            Condition docCond = new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Document);
                            AutomationElement doc = win.FindFirst(TreeScope.Descendants, docCond);

                            if (doc != null)
                            {
                                Condition trueCond = Condition.TrueCondition;
                                AutomationElementCollection allDesc = doc.FindAll(TreeScope.Descendants, trueCond);

                                AutomationElement userEdit = null;
                                AutomationElement passEdit = null;

                                // 1. EXPLICIT PASSWORD FIELD IDENTIFICATION
                                Condition passCond = new PropertyCondition(AutomationElement.IsPasswordProperty, true);
                                passEdit = doc.FindFirst(TreeScope.Descendants, passCond);

                                // 2. EXPLICIT USERNAME FIELD IDENTIFICATION (non-password Edit or ValuePattern element)
                                Condition editCond = new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Edit);
                                AutomationElementCollection pageEdits = doc.FindAll(TreeScope.Descendants, editCond);

                                foreach (AutomationElement edit in pageEdits)
                                {
                                    if (passEdit != null && edit == passEdit) continue;
                                    try
                                    {
                                        if (!edit.Current.IsPassword)
                                        {
                                            userEdit = edit;
                                            break;
                                        }
                                    }
                                    catch {}
                                }

                                if (userEdit == null)
                                {
                                    foreach (AutomationElement el in allDesc)
                                    {
                                        if (passEdit != null && el == passEdit) continue;
                                        try
                                        {
                                            object patternObj;
                                            if (el.TryGetCurrentPattern(ValuePattern.Pattern, out patternObj) && patternObj != null)
                                            {
                                                if (!el.Current.IsPassword)
                                                {
                                                    userEdit = el;
                                                    break;
                                                }
                                            }
                                        }
                                        catch {}
                                    }
                                }

                                if (passEdit == null)
                                {
                                    foreach (AutomationElement edit in pageEdits)
                                    {
                                        if (userEdit != null && edit == userEdit) continue;
                                        try
                                        {
                                            string nameStr = ((edit.Current.Name ?? "") + " " + (edit.Current.AutomationId ?? "")).ToLower();
                                            if (nameStr.Contains("pass") || edit.Current.IsPassword)
                                            {
                                                passEdit = edit;
                                                break;
                                            }
                                        }
                                        catch {}
                                    }
                                    if (passEdit == null && pageEdits.Count >= 2)
                                    {
                                        passEdit = pageEdits[1];
                                    }
                                }

                                // SUCCESS CASE: Standard HTML / ExtJS / React / Vue / Mail / HRIS / Ticket
                                if (userEdit != null && passEdit != null && userEdit != passEdit)
                                {
                                    SetElementValue(userEdit, username);
                                    Thread.Sleep(120);
                                    SetElementValue(passEdit, password);
                                    Thread.Sleep(150);

                                    // Trigger Submit Button
                                    bool clicked = false;
                                    foreach (AutomationElement el in allDesc)
                                    {
                                        try
                                        {
                                            string name = (el.Current.Name ?? "").ToLower();
                                            string classNm = (el.Current.ClassName ?? "").ToLower();

                                            if ((name.Contains("log") || name.Contains("sign") || name.Contains("submit") || name.Contains("enter") || classNm.Contains("btn")) &&
                                                !name.Contains("forgot") && !name.Contains("reset") && !name.Contains("help"))
                                            {
                                                object invObj;
                                                if (el.TryGetCurrentPattern(InvokePattern.Pattern, out invObj) && invObj != null)
                                                {
                                                    ((InvokePattern)invObj).Invoke();
                                                    clicked = true;
                                                    break;
                                                }
                                            }
                                        }
                                        catch {}
                                    }

                                    if (!clicked)
                                    {
                                        try
                                        {
                                            passEdit.SetFocus();
                                            SendKeys.SendWait("{ENTER}");
                                        }
                                        catch {}
                                    }

                                    return;
                                }

                                // FLUTTER WEB CANVAS FALLBACK (ess.payrollsolutions.ph)
                                if (isFlutter && (userEdit == null || passEdit == null))
                                {
                                    try
                                    {
                                        doc.SetFocus();
                                        Thread.Sleep(200);

                                        SendKeys.SendWait("{TAB}");
                                        Thread.Sleep(100);
                                        SendKeys.SendWait("^a{BACKSPACE}");
                                        SendKeys.SendWait(username);
                                        Thread.Sleep(150);
                                        SendKeys.SendWait("{TAB}");
                                        Thread.Sleep(100);
                                        SendKeys.SendWait("^a{BACKSPACE}");
                                        SendKeys.SendWait(password);
                                        Thread.Sleep(150);
                                        SendKeys.SendWait("{ENTER}");
                                        return;
                                    }
                                    catch {}
                                }
                            }
                        }
                    }
                }
                catch {}
            }
        }

        static void SetElementValue(AutomationElement el, string val)
        {
            if (el == null || val == null) return;
            try
            {
                el.SetFocus();
                object patternObj;
                if (el.TryGetCurrentPattern(ValuePattern.Pattern, out patternObj) && patternObj != null)
                {
                    ValuePattern vp = (ValuePattern)patternObj;
                    if (!vp.Current.IsReadOnly)
                    {
                        vp.SetValue(val);
                        return;
                    }
                }
            }
            catch {}

            try
            {
                el.SetFocus();
                SendKeys.SendWait("^a{BACKSPACE}");
                SendKeys.SendWait(val);
            }
            catch {}
        }
    }
}
